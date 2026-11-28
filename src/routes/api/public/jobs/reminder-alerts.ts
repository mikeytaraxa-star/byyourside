import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { alertActions, dailySummary, localClock, shouldSendSummary } from "@/lib/reminder-alerts";
import { emailRecipient } from "@/lib/email-alerts";

export const Route = createFileRoute("/api/public/jobs/reminder-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const connectionKey = process.env["TELEGRAM_API_KEY"];
        const lovableKey = process.env["LOVABLE_API_KEY"];
        if (!lovableKey) return Response.json({ ok: false, skipped: "Messaging credentials unavailable" }, { status: 503 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { loadFamilyEmail, deliverReminderAlert } = await import("@/lib/email-alerts.server");
        const { data: circles, error } = await supabaseAdmin.from("care_circles").select("id, telegram_chat_id, timezone, summary_time, summary_sent_on").order("id").limit(1000);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        let sent = 0;
        let emailsSent = 0;
        let emailsSuppressed = 0;
        let emailsFailed = 0;
        const failures: string[] = [];
        const send = async (chatId: number, text: string) => {
          if (!connectionKey) { failures.push("Telegram not linked; approved email alerts are still attempted"); return false; }
          const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
            method: "POST",
            headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connectionKey, "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
          });
          if (!res.ok) {
            console.error(`Telegram alert failed [${res.status}]`);
            failures.push(`Telegram alert failed [${res.status}]`);
            return false;
          }
          const body: unknown = await res.json();
          if (!body || typeof body !== "object" || !("ok" in body) || body.ok !== true) {
            failures.push("Telegram refused an alert");
            return false;
          }
          sent++;
          return true;
        };

        for (const circle of circles ?? []) {
          const { date, minute } = localClock(new Date(), circle.timezone);
          let recipient: string | null = null;
          try {
            recipient = emailRecipient((await loadFamilyEmail(supabaseAdmin, circle.telegram_chat_id))?.state ?? null);
          } catch {
            failures.push("Email preferences unavailable; Telegram alerts continue");
          }
          const { data: reminders } = await supabaseAdmin.from("reminders")
            .select("id, local_time, title, detail, nudged_on, alerted_on, confirmed_on, critical, missed_streak, last_missed_on").eq("circle_id", circle.id).limit(50);
          for (const action of alertActions(reminders ?? [], date, minute)) {
            // Claim the reminder first so overlapping runs can never send the same message twice.
            const previous = (reminders ?? []).find((r) => r.id === action.id);
            const delivered = action.kind === "nudge"
              ? { nudged_on: date }
              : {
                  alerted_on: date,
                  nudged_on: date,
                  ...(action.missedStreak === undefined ? {} : { missed_streak: action.missedStreak, last_missed_on: date }),
                };
            const column = action.kind === "nudge" ? "nudged_on" : "alerted_on";
            const { data: claimed, error: claimError } = await supabaseAdmin.from("reminders").update(delivered)
              .eq("id", action.id).or(`${column}.is.null,${column}.neq.${date}`).or(`confirmed_on.is.null,confirmed_on.neq.${date}`).select("id");
            if (claimError) failures.push("Reminder alert could not be claimed");
            if (!claimed?.length || !previous) continue;
            const result = await deliverReminderAlert({ action, reminder: previous, circleId: circle.id, date, recipient,
              sendTelegram: () => send(circle.telegram_chat_id, action.text),
            });
            if (result.emailStatus === "sent") emailsSent++;
            if (result.emailStatus === "suppressed") emailsSuppressed++;
            if (result.emailStatus === "failed") { emailsFailed++; failures.push("Email alert was not accepted; check email sending status"); }
            if (!result.telegramSent) {
              failures.push("Telegram alert was not accepted");
              await supabaseAdmin.from("reminders").update({
                nudged_on: previous.nudged_on, alerted_on: previous.alerted_on,
                missed_streak: previous.missed_streak, last_missed_on: previous.last_missed_on,
              }).eq("id", action.id);
            }
          }
          if (shouldSendSummary(circle.summary_time, circle.summary_sent_on, date, minute)) {
            const { data: claimed } = await supabaseAdmin.from("care_circles").update({ summary_sent_on: date })
              .eq("id", circle.id).or(`summary_sent_on.is.null,summary_sent_on.neq.${date}`).select("id");
            if (claimed?.length) {
              const text = dailySummary(reminders ?? [], date, minute);
              if (!await send(circle.telegram_chat_id, text)) {
                await supabaseAdmin.from("care_circles").update({ summary_sent_on: circle.summary_sent_on }).eq("id", circle.id);
              }
            }
          }
        }
        return Response.json({ ok: failures.length === 0, sent, emailsSent, emailsSuppressed, emailsFailed, failures });
      },
    },
  },
});
