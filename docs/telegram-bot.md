# Telegram bot — @bysappbot

Bot: <https://t.me/bysappbot>

## Commands

| Command | Example | Result |
| --- | --- | --- |
| `/remind HH:MM text` | `/remind 08:00 Take the blue pill from the table` | Adds a daily reminder. |
| `/critical HH:MM text` | `/critical 08:00 Blue pill — with water` | Adds an important reminder with second-consecutive-day escalation. |
| `/summary HH:MM` | `/summary 21:00` | Sets the daily family-summary time in the circle's time zone. |
| `/summary off` | `/summary off` | Disables the daily summary; `/summary` shows the current setting. |
| `/person Name \| relation \| detail` | `/person Anna \| daughter \| lives in New York` | Adds a familiar person. |
| `/ask question` | `/ask Who is Anna?` | Answer grounded in the care circle (Cocoon, or labelled demo). |
| `/done HH:MM` | `/done 08:00` | Marks today's reminder done and stops the alert. |
| `/timezone Area/City` | `/timezone Europe/Berlin` | Sets the care circle's time zone. |
| `/pair` | `/pair` | Issues a single-use 10-character code for the glasses app (15 minutes). |

## Notifications

- **At due time** — the reminder is sent to the chat, independently of whether the glasses are being worn.
- **After 15 minutes unconfirmed** — one alert per reminder per day, e.g. "Blue pill not confirmed yet".
- **Second consecutive day** — `/critical` reminders produce a stronger SECOND DAY alert if still unconfirmed; a same-day confirmation resets the streak.
- **Daily summary** — at 21:00 local time by default, listing confirmed, not-confirmed and upcoming reminders. `/summary HH:MM` changes it and `/summary off` disables it.
- **On glasses tap** — "✅ done" is posted to the family chat.

“Confirmed” records a tap or `/done`; it does not verify medication ingestion. See [real-day fallback scenarios](real-day-and-market.md) for showers, charging, forgotten glasses and offline behavior.

## /findme

- Works when the glasses app is paired and **Phone location** is switched on (opt-in).
- While open, the glasses app shares its location with each minute sync; nothing is sent when the toggle is off.
- `/findme` replies with a map card (Telegram venue) showing how old the location is and its accuracy, plus a maps link.
- If the last location is older than 10 minutes, the next sync with a location sends a fresh map card automatically.
- It is a convenience feature, not an emergency service.

## Setup

1. Create the bot with @BotFather and connect it through the app's secure Telegram connection (never paste the token into code or chat).
2. Register the signed webhook at the stable production endpoint: `https://project--ebbc3243-b866-43f7-baa1-8e196c6f1290.lovable.app/api/public/telegram/webhook`. The endpoint rejects requests without Telegram's secret-token header.
3. Send `/start` to the bot and add a first reminder.

The bot token is held only by the encrypted Telegram connection. Server code receives the separate `TELEGRAM_API_KEY` connection key at runtime; neither value belongs in source, `.env`, browser code, screenshots or Git history. The stable endpoint is intentional: custom-domain deployments can briefly lag behind a new publish.
