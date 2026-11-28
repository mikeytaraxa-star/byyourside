# ByYourSide live integrations

- [x] Prepare managed email sending and a family reminder-alert template for notify.byside.here; email sending remains server-only, with no email queue or database tables.
- [x] Add /email enrollment with mailbox verification and simultaneous email delivery for 15-minute and critical Telegram alerts; docs updated, full handler flow tested with isolated service doubles, protected runtime endpoints and rendered templates checked.
- [ ] Verify live email delivery to the user's supplied test inbox — blocked by sender-domain DNS verification, publishing and the user's mailbox approval; keep the inbox out of source and docs.

- [x] Keep ByYourSide free and remove proposed prices, subscriptions and payer models from judge-facing materials.

- [x] Add real-day fallback scenarios for showering, charging, forgotten glasses, offline use and reopening.
- [x] Add a configurable daily Telegram family summary of confirmed, missed and upcoming reminders.
- [x] Mark important reminders and alert families when they remain unconfirmed on a second consecutive day.
- [x] Add sourced market research and competitor positioning while keeping the service free.
- [x] Verify the new scheduling rules, tests, documentation and browser presentation.

- [x] Add and verify a shareable /demovideo page for the narrated hackathon film, linked from site navigation; desktop/mobile playback, seeking and navigation checked.

- [x] Render a three-minute hackathon demo draft with male narration, the founder's real motivation, existing motion-design reference, and honest integration-status labels; file and still-frame checks complete, playback/listening review pending.

- [x] Build a dedicated native G2 app with device-only connection, local reminders, shared gesture handling, and safe lifecycle cleanup.
- [x] Produce and validate an official Even Hub installation package and hardware setup instructions.
- [x] Verify native bridge flows with an instrumented bridge and phone/desktop-sized browser, including the offline package entry.
- [ ] Register/install the beta build and verify physical G2/R1 — blocked by unavailable hardware and the user's Even Hub account; local developer QR instructions are included.

- [x] Connect tap, double-tap, swipes, hold/release, R1 source events, and contextual menu actions to the showcase.
- [x] Keep real local microphone capture with explicit permission; use selected Cocoon demo questions instead of external speech transcription.
- [x] Verify Cocoon-only demo questions, discarded audio, and no other AI service calls; physical G2/R1 checks remain unavailable without devices.

- [x] Link @bysappbot through the encrypted Telegram connector, verify the bot identity, register the signed stable-production webhook, and confirm signed webhook requests return HTTP 200. No Telegram token was found in tracked files or Git history.
- [x] Confirm the first real `/start` welcome message in the user's Telegram chat — the user received it from @bysappbot.
- [x] Add private persistent storage for reminders, people, and Telegram updates.
- [x] Add a secure Cocoon OpenAI-compatible adapter with server-only credentials and no repository keys.
- [ ] Supply a Cocoon client endpoint and its authentication configuration — blocked because no Cocoon client access is available; the official developer site does not currently offer a public API-key signup.
- [x] Add a clearly labeled Cocoon demo showing a question and sample glasses answer.
- [x] Add official G2 tap, phone-location, and head-motion APIs through the Even Hub SDK.
- [x] Add a no-hardware location and motion showcase with explicit simulation labels.
- [x] Verify command, AI, sensor, routing, type, and browser flows; physical G2 verification is not required for this hackathon demo.

