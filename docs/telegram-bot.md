# Telegram bot — @bysappbot

Bot: <https://t.me/bysappbot>

## Commands

| Command | Example | Result |
| --- | --- | --- |
| `/remind HH:MM text` | `/remind 08:00 Take the blue pill from the table` | Adds a daily reminder. |
| `/person Name \| relation \| detail` | `/person Anna \| daughter \| lives in New York` | Adds a familiar person. |
| `/ask question` | `/ask Who is Anna?` | Answer grounded in the care circle (Cocoon, or labelled demo). |
| `/done HH:MM` | `/done 08:00` | Marks today's reminder done and stops the alert. |
| `/timezone Area/City` | `/timezone Europe/Berlin` | Sets the care circle's time zone. |
| `/pair` | `/pair` | Issues a single-use six-digit code for the glasses app (15 minutes). |

## Notifications

- **At due time** — the reminder is sent to the chat.
- **After 15 minutes unconfirmed** — one alert per reminder per day, e.g. "Blue pill not confirmed yet".
- **On glasses tap** — "✅ done" is posted to the family chat.

## /findme

- Works when the glasses app is paired and **Phone location** is switched on (opt-in).
- While open, the glasses app shares its location with each minute sync; nothing is sent when the toggle is off.
- `/findme` replies with a map card (Telegram venue) showing how old the location is and its accuracy, plus a maps link.
- If the last location is older than 10 minutes, the next sync with a location sends a fresh map card automatically.
- It is a convenience feature, not an emergency service.

## Setup

1. Create the bot with @BotFather and connect it through the app's secure Telegram connection (never paste the token into code or chat).
2. Register the webhook: `https://<published-domain>/api/public/telegram/webhook` with a secret token.
3. Send `/start` to the bot and add a first reminder.
