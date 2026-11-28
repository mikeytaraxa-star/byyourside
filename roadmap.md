# ByYourSide live integrations

## Security and functionality audit

- [x] Review authored app source, access boundaries, private media, device synchronization, dependencies and database privileges; fix verified access, credential lifecycle, hidden reminder action and recovery issues with regression tests.
- [x] Run the full automated suite and authenticated browser save/readback/export/logout/edit/undo/erase checks; record evidence and limitations in docs/security-audit-2026-11-28.md.
- [x] Complete the independent deep security scan; harden the reported media path boundary and retain the residual two-minute signed-link warning. No absolute security guarantee is possible.
- [ ] Complete production acceptance for live Telegram invitations, email delivery, Cocoon and physical G2/R1 — blocked by user/second-account participation, approved mailbox/provider access and hardware.
- [ ] Certify clinical/localization suitability — blocked by qualified clinical/native-language reviewers; automated checks cannot provide this certification.

## Family voice and gentle recap

- [x] Add consent-based short family recordings with preview, discard, private saving and phone-controlled playback.
- [x] Add explicitly family-approved dated moments/photos to a calm, optional day recap without quizzes.
- [x] Test private media access, recording cleanup, approval/date filtering and real isolated family-to-companion readback; test media and records removed. Physical phone microphone/browser acceptance remains outside this verification.

## Interface languages

- [x] Audit all 16 language dictionaries, extend wearer/pairing/consent/native-menu translations, verify language switching and right-to-left layout, and document coverage limits in docs/localization.md. Family-authored care content is preserved; some family forms, server messages and public pages remain English, so this is not complete app localization.
- [ ] Obtain native-speaker and physical G2 language acceptance — blocked by unavailable reviewers and hardware; automated/browser checks cannot certify error-free clinical wording or device glyph rendering.
- [x] Add interface languages beyond English: German, Spanish, French plus the most widely spoken languages (user asked to "add all popular languages"). Covers glasses prompts, the Loved One view and family workspace navigation; family-written greetings, reminders and notes stay in the family's own words. Shipped: 16 languages (English, German, Spanish, French, Italian, Portuguese, Dutch, Polish, Ukrainian, Russian, Turkish, Arabic with right-to-left layout, Hindi, Chinese, Japanese, Korean), chosen in the family workspace settings and on the glasses companion screen. Translations other than English are machine-assisted and have not been reviewed by native speakers.

## Everyday companion upgrade

- [x] Add private family membership, short-lived access, occurrence actions, and durable offline reminder synchronization.
- [x] Add later/help/decline/repeat, daily orientation, step-by-step routines, reassurance notes, and phone-first use.
- [x] Add the family workspace, editor, invitations, handover, history, and check-in ownership.
- [x] Add quiet periods, response recipients, availability notices, aggregate delivery evidence, and notification readiness tests.
- [x] Add private family media, contact shortcuts, phone reading settings, access revocation, and export/deletion handlers.
- [x] Extend bounded Cocoon questions and approved wording drafts without another AI provider.
- [x] Verify isolated real-data save/sync/action/readback, duplicate handling, cross-family denial, permissions and device revocation; refresh docs and the Even Hub package. Full suite: 126 tests passed.
- [ ] Enable and live-test the Telegram Mini App menu — published family destinations now return 200 in the security audit; still requires publication approval and real Telegram-client acceptance before changing the restored commands menu.
- [ ] Confirm real Telegram family opening and invitation acceptance — requires the user's Telegram session and a consenting second account; signed-launch and invitation-command checks are automated, not live-client verification.
- [ ] Verify live Cocoon/speech, physical G2/R1, and real email delivery — blocked by provider access, hardware and verified sender/mailbox.
- [x] Add appointment preparation offsets, grouped ordinary notices, per-recipient delivery evidence and offline routine-step replay on G2.
- [x] Strengthen atomic edit/undo recovery with transactional server-only operations and verify stale undo rejection against real isolated family data.
- [x] Document incomplete automatic routine/preparation-priority behavior in the security audit; current manual routine selection remains, and physical acceptance is blocked by unavailable hardware.

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

