<p align="center">
  <img src="public/favicon.png" alt="ByYourSide logo" width="96" />
</p>

<h1 align="center">ByYourSide</h1>

<p align="center">
  A quiet companion for people living with memory loss.<br/>
  Families manage care in Telegram. Your Loved One sees gentle prompts on Even Realities G2 glasses.
</p>

<p align="center">
  <a href="https://byside.here">Live app</a> ·
  <a href="https://t.me/bysappbot">@bysappbot</a> ·
  <a href="docs/architecture.md">Architecture</a> ·
  <a href="docs/g2-hardware.md">G2 setup</a>
</p>

---

## Why

More than 55 million people live with dementia, most of them at home. Independence rarely breaks in one moment; it erodes through small gaps — a missed pill, a forgotten allergy, an appointment that slips. Phones demand attention, notes stay where they were left, and alarms say *that* something is due but not *what*.

ByYourSide puts one short, warm prompt in the corner of the wearer's view, at the right time, without blocking what is in front of them — and keeps the family in the loop.

## How it works

| Who | Where | What they do |
| --- | --- | --- |
| Family / care partner | Telegram, [@bysappbot](https://t.me/bysappbot) | Add reminders and familiar people in plain messages; receive confirmations and missed-reminder alerts. |
| Your Loved One | Even Realities G2 glasses (+ optional R1 ring) | See one prompt at a time; tap to confirm, swipe to browse, hold to ask a question. |

1. **Add** — `/remind 08:00 Take the blue pill from the table`, `/person Anna | daughter | lives in New York`.
2. **Pair** — `/pair` returns a single-use 10-character code (valid 15 minutes) that is entered once in the glasses app.
3. **Remind** — while open, the glasses app syncs every minute and shows the prompt when due. Reminders are cached on the phone for offline use.
4. **Confirm** — one tap marks it done; the family receives "✅ done" in Telegram.
5. **Find me** — `/findme` sends the glasses' last shared location to the family as a Telegram map card (opt-in).
6. **Safety net** — if a reminder is not confirmed within 15 minutes the family is alerted once; missed items appear first ("EARLIER") when the glasses app is reopened. `/critical` reminders escalate when unconfirmed on a second consecutive day.
7. **Daily summary** — at 21:00 local time (configurable with `/summary HH:MM`, or `/summary off`), Telegram lists confirmed, not-confirmed and upcoming reminders. Confirmation means a tap or `/done`, not proof that medication was taken.

Real-day fallback scenarios and competitor research are documented in [Real day & market research](docs/real-day-and-market.md). ByYourSide is intended to remain free for everyone.

## Integrations

- **Telegram** — family interface, pairing, nudges, alerts and confirmations via a verified webhook. See [docs/telegram-bot.md](docs/telegram-bot.md).
- **Even Realities G2 / R1** — native display, gestures, menu actions, microphone, location and head motion through the official Even Hub SDK. See [docs/g2-hardware.md](docs/g2-hardware.md).
- **Cocoon (TON confidential compute)** — private answers to "who / what / when" questions, grounded only in family-entered facts, through a server-only OpenAI-compatible adapter. See [docs/integrations.md](docs/integrations.md).

## Project status

| Area | Status |
| --- | --- |
| Web showcase, 3D glasses, first-person film | Live |
| G2 companion app (`/g2`, `.ehpk` package) | Built; tested with an instrumented bridge |
| Reminder engine, 15-minute alerts, catch-up | Live (checked every minute) |
| Pairing and tap-to-Telegram confirmation | Built and tested end to end |
| Telegram bot linking | Pending platform connection |
| Live Cocoon endpoint | Pending client access — answers labelled `COCOON AI · DEMO` |
| Physical G2 / R1 verification | Pending hardware access |

Every simulated feature is labelled as such in the interface.

## Repository layout

```text
src/
  routes/              Pages (/, /g2, /docs, /install, /terms) and server routes
    api/public/        Telegram webhook, G2 pair/sync/done, reminder-alert job
  components/demo/     Showcase UI, 3D glasses, pure demo engine and gesture decoder
  components/g2/       Shared G2 companion app
  lib/                 Cocoon adapter, pairing, alerts, G2 display rules, sync
g2/                    Standalone Even Hub entry and app manifest
scripts/package-g2.ts  Builds the .ehpk package into public/downloads
drizzle/               Database schema and migrations
docs/                  Architecture, integrations, Telegram bot, G2 hardware, privacy
```

## Getting started

Requirements: [Bun](https://bun.sh) 1.x (or Node 20+).

```sh
bun install
bun run dev          # http://localhost:8080
bun run test         # unit tests (vitest)
bun run g2:package   # build the Even Hub .ehpk
```

The showcase runs without any credentials. Live services are enabled by server-side configuration only — see [Configuration](docs/integrations.md).

## Configuration

No keys are stored in this repository. Server-side settings:

| Variable | Purpose |
| --- | --- |
| `TELEGRAM_API_KEY` | Telegram bot connection (provided by the connector) |
| `COCOON_BASE_URL` | HTTPS URL of a running Cocoon client |
| `COCOON_API_KEY` | Credential for that client |
| `COCOON_MODEL` | Optional model name (default `Qwen/Qwen3-32B`) |

## Privacy & safety

Care data is stored in private tables with no anonymous access, Telegram updates are verified, microphone audio stays on the device, and AI questions are designed to run inside Cocoon's confidential compute. ByYourSide is a support tool — **not a medical device or emergency service**. Details: [docs/privacy-security.md](docs/privacy-security.md).

## Tech stack

TanStack Start (React 19, Vite), Tailwind CSS v4, Three.js / React Three Fiber, Even Hub SDK, Postgres with row-level security, Vitest.

## Hackathon declaration

**Built during the hackathon.** ByYourSide was built by a solo developer (a team of one) during the Even Realities hackathon, 23–29 November 2026. The repository history starts on 23 November 2026; every commit is from the hackathon period.

**Code that existed before (disclosure).** The only pre-existing code is:

- The standard Lovable TanStack Start starter template (first commit, `template: tanstack_start_ts…`) — project setup, build configuration and generic UI components under `src/components/ui/`.
- Open-source packages installed from npm (listed in `package.json`), including the official Even Realities Even Hub SDK, React, TanStack, Three.js and Tailwind CSS, each under its own licence.

All product code — the reminder engine, Telegram bot, pairing and sync, Cocoon adapter, G2 companion app, 3D glasses, film cues, branding and docs — was written during the hackathon. The logo, background texture and demo film were created during the hackathon with generative tools.

**Terms of service and privacy.** The project uses only official, documented interfaces: the Telegram Bot API, the Even Hub SDK and Cocoon's OpenAI-compatible client. It sends no unsolicited messages and contacts only the chats that start the bot. All people, names, addresses and conversations shown in the demo (e.g. "Anna", "128 Willow Lane") are fictional; no real user's messages are shown. See [docs/privacy-security.md](docs/privacy-security.md).

**Promotion consent.** I approve that the organizers may feature the project name, video and screenshots in hackathon communications.

## Built for

The Even Realities hackathon on DoraHacks — Telegram, crypto (TON) and AI assistant track.
