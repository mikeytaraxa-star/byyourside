<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.

<!-- LOVABLE:END -->

- Demo logic (command parsing, answers) lives in src/components/demo/engine.ts as pure functions so the real Telegram bot can reuse it.
- Telegram updates enter through the verified TanStack webhook and use service-only care tables; do not add anonymous reads of family data.
- Cocoon calls stay behind the server-only OpenAI-compatible adapter; credentials come from runtime configuration, never source or browser code.
- G2 hardware APIs stay behind the dynamic SDK import in use-even-hub.ts; normal browsers use explicitly labeled simulations.
- Decode G2/R1 gestures in a browser-safe pure module and route them through one showcase handler so native and simulated controls have identical behavior.
- Voice captures consent-gated local device/G2 audio, discards it without uploads, and uses explicitly selected sample questions for grounded demo answers; this keeps showcase microphone input separate from unimplemented speech recognition.
- Serialize native glasses display writes through a latest-value queue and discard pending writes on disconnect so slow device responses cannot restore stale templates.
- Keep the hardware companion in a shared G2App used by /g2 and the standalone Even Hub entry; package only browser-safe code with no bundled credentials; optional Telegram sync uses a per-device token from one-time /pair codes against the published site's /api/public/g2 endpoints, falling back to local storage offline.
- Store the hardware schedule through Even App local storage, with browser storage as a preview fallback; reset completion on local calendar rollover without claiming family synchronization.
- Native G2 display regions and text limits live in g2-display.ts; validate SDK containers and keep the clock aligned with the reminder heading and the action in its own bottom region.
- Fullscreen film cues use media currentTime and a pure scene map, not wall-clock timers or scene recognition; keep scripted samples separate from live reminders and native G2 writes.
- Brand artwork ships as a vector traced from the approved raster mark; keep public/favicon.png (copied into the Even Hub package) and public/favicon.svg derived from the same mark so web and hardware show one logo.
- Keep the judge-facing narrated film on its own /demovideo route with CDN asset pointers and native video controls so the shareable page stays lightweight and playback remains user-controlled.
- App emails use the server-only managed send helper and React Email registry; preview routes authenticate themselves, and no email queues or database tables are created because delivery and unsubscribe handling are managed externally.
- Family email enrollment enriches existing private Telegram command events with hashed, expiring mailbox-approval results; read the latest event per chat and send fixed alert templates in parallel with Telegram using event-derived idempotency keys, avoiding email-schema migrations or queues.

- Keep everyday care models and rules in src/lib/care; service-only tables are accessed through verified Telegram family sessions or paired-device handlers, always scoped to the resolved circle, so editors and wearers share one schedule.
- Store reminder occurrence actions independently from recurring templates and deduplicate each durable action; reject old-day confirmations so reconnects cannot confirm the wrong medication occurrence.
- Telegram Mini App identity uses freshness-checked production Ed25519 signatures; never trust unsigned launch identities or expose a bot token to validate them.
- Family media belongs in the private care-family-media bucket with scoped short-lived viewing links; do not bundle it with public branding or the hardware package.
