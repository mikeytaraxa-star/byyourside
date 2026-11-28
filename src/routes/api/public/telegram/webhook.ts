import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { z } from "zod";
import { parseCommand } from "@/components/demo/engine";
import type { Json } from "@/integrations/supabase/types";
import { isValidTimeZone, localClock, parseDone } from "@/lib/reminder-alerts";
import { formatPairCode, isPairCommand, newPairCode, PAIR_TTL_MINUTES } from "@/lib/pairing";
import { ageLabel, isFindMeCommand, isFresh, mapsLink, venueBody } from "@/lib/findme";
import { parseEmailCommand } from "@/lib/email-alerts";
import { navigationCommand, navigationGuidance, welcomeKeyboard } from "@/lib/telegram-navigation";

const messageSchema = z
  .object({
    chat: z.object({ id: z.number().int() }).passthrough(),
    from: z.object({ id: z.number().int() }).passthrough().optional(),
    text: z.string().max(4000).optional(),
    date: z.number().int().optional(),
  })
  .passthrough();

const updateSchema = z
  .object({
    update_id: z.number().int(),
    message: messageSchema.optional(),
    edited_message: messageSchema.optional(),
  })
  .passthrough();

function deriveWebhookSecret(connectionKey: string) {
  return createHash("sha256").update(`telegram-webhook:${connectionKey}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function sendTelegram(
  chatId: number,
  text: string,
  lovableKey: string,
  connectionKey: string,
  replyMarkup?: ReturnType<typeof welcomeKeyboard>,
) {
  const response = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
    method: "POST",
    redirect: "manual",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) }),
  });
  const body = await response.text();
  if (!response.ok) {
    console.error(`Telegram request failed [${response.status}]: ${body}`);
    throw new Error(`Telegram request failed [${response.status}]: ${body}`);
  }
  const result = z
    .object({ ok: z.boolean(), description: z.string().optional() })
    .passthrough()
    .parse(JSON.parse(body));
  if (!result.ok)
    throw new Error(`Telegram request failed: ${result.description ?? "Unknown provider error"}`);
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const connectionKey = process.env["TELEGRAM_API_KEY"];
        const lovableKey = process.env["LOVABLE_API_KEY"];
        if (!connectionKey || !lovableKey) {
          return Response.json(
            { ok: false, error: "Telegram is ready but not linked yet." },
            { status: 503 },
          );
        }
        const expectedSecret = deriveWebhookSecret(connectionKey);
        const actualSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(actualSecret, expectedSecret))
          return new Response("Unauthorized", { status: 401 });

        let update: z.infer<typeof updateSchema>;
        try {
          update = updateSchema.parse(await request.json());
        } catch {
          return Response.json({ ok: false, error: "Invalid Telegram update" }, { status: 400 });
        }
        const message = update.message ?? update.edited_message;
        if (!message?.text) return Response.json({ ok: true, ignored: true });
        const text = navigationCommand(message.text);

        // Approval codes are secrets: persist only a digest for command deduplication,
        // never the command's plaintext code in the Telegram event or raw payload.
        const emailCommand = parseEmailCommand(text);
        const storedText = emailCommand?.kind === "verify"
          ? `/email verify [${createHash("sha256").update(emailCommand.code).digest("hex")}]`
          : /^\/join(?:@\w+)?\s+/i.test(message.text)
            ? `/join [${createHash("sha256").update(message.text).digest("hex")}]`
            : text;
        const storedUpdate = {
          ...update,
          ...(update.message ? { message: { ...update.message, text: storedText } } : {}),
          ...(update.edited_message ? { edited_message: { ...update.edited_message, text: storedText } } : {}),
        } as unknown as Json;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const chatId = message.chat.id;
        const { data: stored, error: updateError } = await supabaseAdmin
          .from("telegram_updates")
          .upsert(
            {
              update_id: update.update_id,
              chat_id: chatId,
              telegram_user_id: message.from?.id ?? null,
              text: storedText,
              raw_update: storedUpdate,
            },
            { onConflict: "update_id", ignoreDuplicates: true },
          )
          .select("update_id");
        if (updateError)
          return Response.json({ ok: false, error: updateError.message }, { status: 500 });
        if (!stored?.length) return Response.json({ ok: true, duplicate: true });

        // Ignore the same command repeated from this chat within a few seconds (double taps, resent Start).
        const { data: recent } = await supabaseAdmin
          .from("telegram_updates")
          .select("update_id")
          .eq("chat_id", chatId)
          .eq("text", storedText)
          .neq("update_id", update.update_id)
          .gte("created_at", new Date(Date.now() - 10_000).toISOString())
          .limit(1);
        if (recent?.length) return Response.json({ ok: true, repeated: true });

        const { data: circle, error: circleError } = await supabaseAdmin
          .from("care_circles")
          .upsert({ telegram_chat_id: chatId }, { onConflict: "telegram_chat_id" })
          .select("id, summary_time")
          .single();
        if (circleError || !circle)
          return Response.json(
            { ok: false, error: circleError?.message ?? "Care circle unavailable" },
            { status: 500 },
          );

        let reply = "";
        // A Telegram sender is trusted only after the webhook signature was checked.
        // The circle's first creator owns it; other relatives explicitly accept invitations.
        const { data: existingMembers } = await supabaseAdmin.from("care_members").select("id").eq("circle_id", circle.id).limit(1);
        if (!existingMembers?.length && message.from?.id) {
          await supabaseAdmin.from("care_members").upsert({ circle_id: circle.id, telegram_user_id: message.from.id, role: "owner", member_name: typeof message.from["first_name"] === "string" ? message.from["first_name"].slice(0, 80) : "Family member", direct_chat_id: chatId > 0 ? chatId : null }, { onConflict: "circle_id,telegram_user_id", ignoreDuplicates: true });
        }
        if (text === "/start" && chatId > 0 && message.from?.id) {
          await supabaseAdmin.from("care_members").update({ direct_chat_id: chatId }).eq("telegram_user_id", message.from.id).is("revoked_at", null);
        }
        const { data: membership } = await supabaseAdmin.from("care_members").select("role").eq("circle_id", circle.id).eq("telegram_user_id", message.from?.id ?? 0).is("revoked_at", null).maybeSingle();
        const accessCommand = /^\/(start|help|family|join)(?:@\w+)?(?:\s|$)/i.test(text);
        const careAction = /^\/(later|needhelp|nottoday|again)(?:@\w+)?\s/i.test(text);
        const readCommand = /^\/(findme|ask)(?:@\w+)?(?:\s|$)/i.test(text) || careAction;
        if (!accessCommand && (!membership || (!readCommand && membership.role === "viewer"))) {
          reply = "Your family owner must grant permission for this command. Ask them for an invitation in /family.";
        } else if (navigationGuidance(text)) {
          reply = navigationGuidance(text) ?? "Send /help to see the available commands.";
        } else if (/^\/(family|join|later|needhelp|nottoday|again)(?:@\w+)?(?:\s|$)/i.test(text)) {
          const { telegramCareCommand } = await import("@/lib/care/telegram.server");
          reply = await telegramCareCommand(supabaseAdmin, circle.id, message.from?.id, chatId, text, typeof message.from?.["first_name"] === "string" ? message.from["first_name"] : "Family member") ?? "Check the command and try again.";
        } else if (emailCommand) {
          const { handleEmailCommand } = await import("@/lib/email-alerts.server");
          try {
            reply = await handleEmailCommand({ client: supabaseAdmin, chatId, senderId: message.from?.id, updateId: update.update_id, rawUpdate: storedUpdate, command: emailCommand });
          } catch {
            reply = "I couldn't read or save your email settings. Please try again later; Telegram alerts continue.";
          }
        } else if (text === "/start" || text === "/help") {
          reply =
            "💚 ByYourSide is ready.\n\nAdd a reminder:\n/remind 14:00 Blue pill — with water\n\nMark medication or another important reminder:\n/critical 08:00 Blue pill — with water\n\nAdd someone familiar:\n/person Anna | daughter | visits Sundays\n\nAsk a private AI question:\n/ask What is next?\n\nMark a reminder done:\n/done 14:00\n\nConnect the glasses:\n/pair\n\nFind Your Loved One (glasses location):\n/findme\n\nSet your time zone:\n/timezone Europe/Berlin\n\nDaily family summary (default 21:00):\n/summary 21:00 or /summary off\n\nEmail backup for missed reminders:\n/email your-address@example.com\nApprove with the code emailed to an inbox you own. /email checks status; /email off removes the backup inbox.\n\nTip: add this bot to a family group with Your Loved One so everyone gets the reminder and the 15-minute check-in.";
          reply += "\n\nFamily editor and routines:\n/family\n\nOther reminder choices:\n/later 14:00 15\n/needhelp 14:00\n/nottoday 14:00\n/again 14:00\n\nImportant postponement requires family permission. Help and Not today never mean done.";
        } else if (/^\/timezone(?:@\w+)?\s+/i.test(text)) {
          const tz = text.replace(/^\/timezone(?:@\w+)?\s+/i, "").trim();
          if (!isValidTimeZone(tz)) reply = "⚠️ I don't know that time zone. Try /timezone Europe/Berlin or /timezone America/New_York";
          else {
            const { error } = await supabaseAdmin.from("care_circles").update({ timezone: tz }).eq("id", circle.id);
            reply = error ? `⚠️ I couldn't save the time zone: ${error.message}` : `🕰 Time zone set to ${tz}. Reminders and check-ins follow this clock.`;
          }
        } else if (isFindMeCommand(text)) {
          const now = new Date();
          await supabaseAdmin.from("care_circles").update({ findme_requested_at: now.toISOString() }).eq("id", circle.id);
          const { data: dev } = await supabaseAdmin.from("g2_devices").select("last_lat, last_lng, last_accuracy, last_location_at").eq("circle_id", circle.id).not("last_location_at", "is", null).order("last_location_at", { ascending: false }).limit(1).maybeSingle();
          if (!dev || dev.last_lat == null || dev.last_lng == null || !dev.last_location_at) {
            reply = "📍 No location has been shared yet.\n\nOn the phone with the glasses, open ByYourSide and turn on “Phone location”. I'll send the map here as soon as it arrives.";
          } else {
            const loc = { lat: dev.last_lat, lng: dev.last_lng, accuracy: dev.last_accuracy, at: dev.last_location_at };
            const { telegramCall } = await import("@/lib/g2-sync.server");
            await telegramCall("sendVenue", venueBody(chatId, loc, now));
            reply = isFresh(loc.at, now)
              ? `📍 Last seen ${ageLabel(loc.at, now)}. Open in maps: ${mapsLink(loc)}\n\nI'll send a fresh update the next time the glasses check in. If this is an emergency, call your local emergency number.`
              : `📍 This location is from ${ageLabel(loc.at, now)}. I've asked the glasses for a fresh one; it arrives within a minute while the app is open.\nMaps: ${mapsLink(loc)}\n\nIf this is an emergency, call your local emergency number.`;
          }
        } else if (isPairCommand(text)) {
          const code = newPairCode();
          const { error } = await supabaseAdmin.from("pairing_codes").insert({ code, circle_id: circle.id, expires_at: new Date(Date.now() + PAIR_TTL_MINUTES * 60_000).toISOString() });
          reply = error ? "⚠️ I couldn't create a code. Please send /pair again." : `👓 Your glasses code: ${formatPairCode(code)}\n\nEnter it once in the ByYourSide app on the phone connected to the glasses. It works for ${PAIR_TTL_MINUTES} minutes and only once.\n\n🔒 Never share this code. ByYourSide will never ask you for it, and anyone who has it could see your family's reminders. If someone asks for it, it's a scam.`;
        } else if (/^\/summary(?:@\w+)?(?:\s+.*)?$/i.test(text)) {
          const setting = text.replace(/^\/summary(?:@\w+)?\s*/i, "").trim();
          if (!setting) {
            reply = circle.summary_time === "off"
              ? "🌙 Daily summaries are off. Send /summary 21:00 to turn them on."
              : `🌙 The daily family summary is set for ${circle.summary_time}. Send /summary 20:30 to change it or /summary off to disable it.`;
          } else if (/^off$/i.test(setting)) {
            const { error } = await supabaseAdmin.from("care_circles").update({ summary_time: "off" }).eq("id", circle.id);
            reply = error ? `⚠️ I couldn't save that: ${error.message}` : "🌙 Daily summaries are off. Send /summary 21:00 to turn them back on.";
          } else {
            const match = setting.match(/^(\d{1,2}):(\d{2})$/);
            const hour = Number(match?.[1]);
            const minute = Number(match?.[2]);
            if (!match || hour > 23 || minute > 59) {
              reply = "⚠️ Use a time like /summary 21:00, or /summary off.";
            } else {
              const summaryTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
              const { error } = await supabaseAdmin.from("care_circles").update({ summary_time: summaryTime }).eq("id", circle.id);
              reply = error ? `⚠️ I couldn't save that: ${error.message}` : `🌙 Daily family summary set for ${summaryTime}. It lists confirmed, not-confirmed and upcoming reminders.`;
            }
          }
        } else if (parseDone(text)) {
          const wanted = parseDone(text)?.time ?? null;
          const { data: tzRow } = await supabaseAdmin.from("care_circles").select("timezone").eq("id", circle.id).single();
          const { date, minute } = localClock(new Date(), tzRow?.timezone ?? "UTC");
          const { data: rows } = await supabaseAdmin.from("reminders").select("id, local_time, title, confirmed_on, date_override").eq("circle_id", circle.id).is("deleted_at", null).order("local_time").limit(100);
          const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
          const open = (rows ?? []).filter((row) => (!row.date_override || row.date_override === date) && row.confirmed_on !== date && toMin(row.local_time) <= minute);
          const match = wanted ? open.find((row) => row.local_time.slice(0, 5) === wanted) : open[open.length - 1];
          if (!match) reply = wanted ? `I couldn't find an open reminder at ${wanted} today.` : "There's nothing due to confirm right now. 💚";
          else {
            const { applyOccurrence } = await import("@/lib/care/service.server");
            try {
              await applyOccurrence(supabaseAdmin, circle.id, { reminderId: match.id, action: "done", key: crypto.randomUUID(), date, minutes: 15 }, "Family member");
              reply = `✅ ${match.title} (${match.local_time.slice(0, 5)}) is confirmed. Thank you!`;
            } catch { reply = "I couldn't confirm that. Please try again."; }
          }
        } else if (/^\/ask\s+/i.test(text)) {
          const question = text.replace(/^\/ask\s+/i, "").slice(0, 500);
          const [{ data: reminders }, { data: people }] = await Promise.all([
            supabaseAdmin
              .from("reminders")
              .select("title, local_time, detail, status")
              .eq("circle_id", circle.id)
              .order("local_time")
              .limit(20),
            supabaseAdmin
              .from("people")
              .select("name, relation, note")
              .eq("circle_id", circle.id)
              .limit(20),
          ]);
          const next = reminders?.find((reminder) => reminder.status === "pending");
          const context =
            [
              ...(people ?? []).map(
                (person) => `${person.name} is their ${person.relation}. ${person.note}`,
              ),
              ...(reminders ?? []).map(
                (reminder) =>
                  `${reminder.local_time}: ${reminder.title}${reminder.detail ? ` — ${reminder.detail}` : ""} (${reminder.status})`,
              ),
            ].join("\n") || "No family reminders or people have been added yet.";
          try {
            const { askCocoon } = await import("@/lib/cocoon.server");
            const result = await askCocoon({
              baseUrl: process.env["COCOON_BASE_URL"],
              apiKey: process.env["COCOON_API_KEY"],
              model: process.env["COCOON_MODEL"],
              question,
              context,
              nextReminder: next ? { title: next.title, local_time: next.local_time } : undefined,
            });
            reply = result.text;
          } catch (error) {
            console.error(error);
            reply = "I couldn’t reach the private AI just now. Please try again in a moment.";
          }
        } else {
          const command = parseCommand(text);
          reply = command.reply;
          if (command.kind === "remind") {
            const { error } = await supabaseAdmin.from("reminders").insert({
              circle_id: circle.id,
              local_time: command.reminder.time,
              title: command.reminder.text,
              detail: command.reminder.detail ?? null,
              critical: command.reminder.critical ?? false,
            });
            if (error) reply = `⚠️ I couldn’t save that reminder: ${error.message}`;
          }
          if (command.kind === "person") {
            const { error } = await supabaseAdmin.from("people").upsert(
              {
                circle_id: circle.id,
                name: command.person.name,
                relation: command.person.relation,
                note: command.person.note,
              },
              { onConflict: "circle_id,name" },
            );
            if (error) reply = `⚠️ I couldn’t save that person: ${error.message}`;
          }
        }

        try {
          await sendTelegram(chatId, reply, lovableKey, connectionKey, welcomeKeyboard(chatId, text));
        } catch (error) {
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : "Telegram reply failed" },
            { status: 502 },
          );
        }
        return Response.json({ ok: true });
      },
    },
  },
});
