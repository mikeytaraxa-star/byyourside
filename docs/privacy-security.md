# Privacy & security

ByYourSide handles intimate information — medication, addresses, family names. The design keeps that data private by default.

## Data handling

- **Cocoon private compute** — AI questions are designed to run on Cocoon, TON's confidential compute network, where models execute inside hardware-protected enclaves (TEEs) so prompts are not visible to GPU providers or network operators. Only the facts needed for an answer are sent.
- **Private storage** — care circles, reminders, people and pairing tokens live in tables with row-level security and no anonymous read access; only server code can access them.
- **Verified entry points** — the Telegram webhook checks Telegram's secret-token header; the reminder job rejects unauthenticated calls; glasses requests require a device token.
- **Honest care status** — daily summaries distinguish a received tap or `/done` from verified medication use. Important-reminder streaks reset on same-day confirmation and never become a medical-risk assessment.
- **Email backup** — the inbox owner approves reminder details using a single-use, hashed code within 15 minutes, in the same Telegram chat/account that requested it. Approval commands are redacted before private event storage. Only an approved inbox receives missed-reminder email; removal and managed suppression stop further feature sends. Email is not an emergency channel and does not prove anyone has read an alert.
- **Pairing** — 10-character codes (~8×10^14 combinations) are single-use and expire after 15 minutes; device tokens can be revoked.
- **Revocation and logout** — removing a member destroys their stored sessions and unused workspace access codes; reinvitation does not revive those credentials. Online sign-out invalidates the current server session. Offline sign-out clears this phone but cannot contact the server, so copied credentials remain valid until expiry or family revocation.
- **Media link limits** — links already issued while authorized can remain valid for up to two minutes after revocation. Downloaded recordings/photos and intentionally cached offline care facts cannot be remotely recalled. This is a residual privacy limitation, not immediate remote erasure.
- **Recovery and deletion** — care edits and undo run transactionally; full-family erasure first revokes access, then removes the entire private media prefix including orphaned uploads, and retries interrupted cleanup through the scheduled job. Deleted notes and media may remain recoverable through change history until full-family erasure.
- **Export** — the download contains paginated care records, including historical occurrences and history values. It excludes credentials, provider delivery logs and media file bytes; referenced files are not a complete media backup. Concurrent edits can still make a multi-page export inconsistent.
- **Microphone** — opt-in with explicit consent, captured locally, never uploaded, stopped after 20 seconds and discarded.
- **Location & motion** — read only with consent through Even App; the browser demo uses fixed sample values. Motion stays on the phone.
- **/findme** — when “Phone location” is on in a paired glasses app, its last location (coordinates, accuracy, time) is stored for that family circle and sent only to its Telegram chat on `/findme`. Not an emergency service.

## Credentials

No API keys, bot tokens or connection secrets are committed. All credentials are supplied through server-side configuration at runtime. The `.env` file contains only public, publishable client identifiers.

## Reporting a vulnerability

Please contact the team via [@bysappbot](https://t.me/bysappbot) rather than opening a public issue.

## Disclaimer

ByYourSide is a support tool, not a medical device, monitoring system or emergency service. See the in-app Terms at `/terms`.

The [28 November audit](security-audit-2026-11-28.md) records checked flows, fixes and remaining release limitations. No scan or test suite can certify 100% security or complete clinical suitability.
