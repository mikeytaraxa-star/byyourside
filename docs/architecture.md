# Architecture

```text
 Family (Telegram)                         Your Loved One (G2 glasses)
        │                                            ▲
        ▼                                            │ display / gestures
 /api/public/telegram/webhook          Even App WebView ─ G2 companion (G2App)
   (secret-token verified)                     │  ▲
        │                                      │  │ /api/public/g2/pair · sync · done
        ▼                                      ▼  │ (per-device token)
 ┌──────────────────────── Server ─────────────────────────┐
 │ command engine · pairing · reminder alerts · Cocoon adapter │
 └──────────────┬───────────────────────────────┬───────────┘
                ▼                               ▼
       Private care tables (RLS)      Cocoon client (TON confidential compute)
                ▲
 /api/public/jobs/reminder-alerts  ← scheduled every minute
```

## Components

| Part | Location | Notes |
| --- | --- | --- |
| Command engine | `src/components/demo/engine.ts` | Pure functions shared by the web demo and the Telegram bot. |
| Telegram webhook | `src/routes/api/public/telegram/webhook.ts` | Verifies Telegram's secret-token header before reading the update. |
| Reminder alerts & summaries | `src/lib/reminder-alerts.ts`, `api/public/jobs/reminder-alerts.ts` | Due-time nudge, family alert after 15 minutes, important-reminder second-day escalation and daily digest; per care-circle time zone. |
| Find me | `src/lib/findme.ts`, telegram webhook, `api/public/g2/sync` | `/findme` returns the last synced location as a Telegram map card; stale locations are refreshed on the next glasses sync. |
| Pairing & sync | `src/lib/pairing.ts`, `src/lib/g2-sync.server.ts`, `api/public/g2/*` | One-time 10-character code → revocable device token; minute sync; tap completion. |
| Cocoon adapter | `src/lib/cocoon.server.ts` | Server-only, OpenAI-compatible; labelled demo answers when unconfigured. |
| G2 companion | `src/components/g2/`, `g2/` | Shared by `/g2` and the packaged `.ehpk`; browser-safe, no bundled credentials. |
| Display rules | `src/lib/g2-display.ts` | Native regions and text limits; validated before every write. |
| Gestures | `src/components/demo/gestures.ts` | One decoder and one handler for native and simulated input. |
| Display queue | `src/lib/latest-update.ts` | Serialised latest-value writes so slow devices never show stale prompts. |
| Film cues | `src/components/demo/film-scenes.ts` | Prompts keyed to video time, not wall-clock timers. |

## Design decisions

- **Telegram for family, glasses for the wearer** — no new app for relatives; one gesture for the person.
- **Server-only secrets** — credentials are read at runtime on the server and never reach the browser or the glasses package.
- **Offline-first glasses app** — reminders are cached locally; sync is additive.
- **Honest simulation** — no-hardware paths are explicitly labelled in the UI.

## Testing

`bun run test` covers command parsing, gestures, film cues, display limits, pairing, alert timing, Cocoon fallbacks, voice capture handling and the display queue.
