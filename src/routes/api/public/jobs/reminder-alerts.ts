import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { alertActions, localClock } from "@/lib/reminder-alerts";

export const Route = createFileRoute("/api/public/jobs/reminder-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const connectionKey = process.env["TELEGRAM_API_KEY"];
        const lovableKey = process.env["LOVABLE_API_KEY"];
        if (!connectionKey || !lovableKey) return Response.json({ ok: true, skipped: "Telegram not linked" });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: circles, error } = await supabaseAdmin.from("care_circles").select("id, telegram_chat_id, timezone");
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        let sent = 0;
        const failures: string[] = [];
        for (const circle of circles ?? []) {
          const { date, minute } = localClock(new Date(), circle.timezone);
          const { data: reminders } = await supabaseAdmin.from("reminders")
            .select("id, local_time, title, detail, nudged_on, alerted_on, confirmed_on").eq("circle_id", circle.id).limit(50);
          for (const action of alertActions(reminders ?? [], date, minute)) {
            const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
              method: "POST",
              headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connectionKey, "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: circle.telegram_chat_id, text: action.text }),
            });
            if (!res.ok) { const body = await res.text(); console.error(`Telegram alert failed [${res.status}]: ${body}`); failures.push(`${res.status}: ${body}`); continue; }
            await supabaseAdmin.from("reminders").update(action.kind === "alert" ? { alerted_on: date, nudged_on: date } : { nudged_on: date }).eq("id", action.id);
            sent++;
          }
        }
        return Response.json({ ok: failures.length === 0, sent, failures });
      },
    },
  },
});
