import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { z } from "zod";
import { parseCommand } from "@/components/demo/engine";
import type { Json } from "@/integrations/supabase/types";
import { isValidTimeZone, localClock, parseDone } from "@/lib/reminder-alerts";
import { isPairCommand, newPairCode, PAIR_TTL_MINUTES } from "@/lib/pairing";
import { ageLabel, isFindMeCommand, isFresh, mapsLink, venueBody } from "@/lib/findme";

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
) {
  const response = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
    method: "POST",
    redirect: "manual",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text }),
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

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const chatId = message.chat.id;
        const { data: stored, error: updateError } = await supabaseAdmin
          .from("telegram_updates")
          .upsert(
            {
              update_id: update.update_id,
              chat_id: chatId,
              telegram_user_id: message.from?.id ?? null,
              text: message.text,
              raw_update: update as unknown as Json,
            },
            { onConflict: "update_id", ignoreDuplicates: true },
          )
          .select("update_id");
        if (updateError)
          return Response.json({ ok: false, error: updateError.message }, { status: 500 });
        if (!stored?.length) return Response.json({ ok: true, duplicate: true });

        const { data: circle, error: circleError } = await supabaseAdmin
          .from("care_circles")
          .upsert({ telegram_chat_id: chatId }, { onConflict: "telegram_chat_id" })
          .select("id")
          .single();
        if (circleError || !circle)
          return Response.json(
            { ok: false, error: circleError?.message ?? "Care circle unavailable" },
            { status: 500 },
          );

        const text = message.text.trim();
        let reply = "";
        if (text === "/start" || text === "/help") {
          reply =
            "💚 ByYourSide is ready.\n\nAdd a reminder:\n/remind 14:00 Blue pill — with water\n\nAdd someone familiar:\n/person Anna | daughter | visits Sundays\n\nAsk a private AI question:\n/ask What is next?\n\nMark a reminder done:\n/done 14:00\n\nConnect the glasses:\n/pair\n\nFind Your Loved One (glasses location):\n/findme\n\nSet your time zone (for reminder alerts):\n/timezone Europe/Berlin\n\nTip: add this bot to a family group with Your Loved One so everyone gets the reminder and the 15-minute check-in.";
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
          reply = error ? "⚠️ I couldn't create a code. Please send /pair again." : `👓 Your glasses code: ${code}\n\nOpen ByYourSide on the phone with the glasses and enter it once. It works for ${PAIR_TTL_MINUTES} minutes.`;
        } else if (parseDone(text)) {
          const wanted = parseDone(text)?.time ?? null;
          const { data: tzRow } = await supabaseAdmin.from("care_circles").select("timezone").eq("id", circle.id).single();
          const { date, minute } = localClock(new Date(), tzRow?.timezone ?? "UTC");
          const { data: rows } = await supabaseAdmin.from("reminders").select("id, local_time, title, confirmed_on").eq("circle_id", circle.id).order("local_time");
          const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
          const open = (rows ?? []).filter((row) => row.confirmed_on !== date && toMin(row.local_time) <= minute);
          const match = wanted ? open.find((row) => row.local_time.slice(0, 5) === wanted) : open[open.length - 1];
          if (!match) reply = wanted ? `I couldn't find an open reminder at ${wanted} today.` : "There's nothing due to confirm right now. 💚";
          else {
            const { error } = await supabaseAdmin.from("reminders").update({ confirmed_on: date, confirmed_at: new Date().toISOString(), status: "done" }).eq("id", match.id);
            reply = error ? `⚠️ I couldn't confirm that: ${error.message}` : `✅ ${match.title} (${match.local_time.slice(0, 5)}) is done. Thank you!`;
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
          await sendTelegram(chatId, reply, lovableKey, connectionKey);
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
