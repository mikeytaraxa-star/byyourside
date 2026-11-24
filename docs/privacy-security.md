# Privacy & security

ByYourSide handles intimate information — medication, addresses, family names. The design keeps that data private by default.

## Data handling

- **Cocoon private compute** — AI questions are designed to run on Cocoon, TON's confidential compute network, where models execute inside hardware-protected enclaves (TEEs) so prompts are not visible to GPU providers or network operators. Only the facts needed for an answer are sent.
- **Private storage** — care circles, reminders, people and pairing tokens live in tables with row-level security and no anonymous read access; only server code can access them.
- **Verified entry points** — the Telegram webhook checks Telegram's secret-token header; the reminder job rejects unauthenticated calls; glasses requests require a device token.
- **Pairing** — 10-character codes (~8×10^14 combinations) are single-use and expire after 15 minutes; device tokens can be revoked.
- **Microphone** — opt-in with explicit consent, captured locally, never uploaded, stopped after 20 seconds and discarded.
- **Location & motion** — read only with consent through Even App; the browser demo uses fixed sample values. Motion stays on the phone.
- **/findme** — when “Phone location” is on in a paired glasses app, its last location (coordinates, accuracy, time) is stored for that family circle and sent only to its Telegram chat on `/findme`. Not an emergency service.

## Credentials

No API keys, bot tokens or connection secrets are committed. All credentials are supplied through server-side configuration at runtime. The `.env` file contains only public, publishable client identifiers.

## Reporting a vulnerability

Please contact the team via [@bysappbot](https://t.me/bysappbot) rather than opening a public issue.

## Disclaimer

ByYourSide is a support tool, not a medical device, monitoring system or emergency service. See the in-app Terms at `/terms`.
