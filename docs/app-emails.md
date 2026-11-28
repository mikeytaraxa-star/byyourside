# App email infrastructure

ByYourSide's sender domain is `notify.byside.here`. At setup it was awaiting DNS verification; check **More → Emails** for its current status and exact DNS records. Verification can take up to 72 hours.

## What is prepared

- A server-only managed send helper using runtime credentials, never keys embedded in source or browser code.
- A React Email registry and family reminder-alert template, with preview data using a fictional medication reminder.
- An API-key-protected template preview for More → Emails.
- Managed delivery, retries, rate limits, suppression and unsubscribe handling. No project email queue, email tables or email schedules are required.

The scaffolded From address is `noreply@notify.byside.here`, with sender name **ByYourSide App**. No recipient is hardcoded; example addresses in earlier discussions are not enrollment or consent.

## Not yet enabled

This infrastructure setup does **not** enroll family recipients or wire email sends into Telegram's missed-reminder checks. Those feature triggers and verified recipient consent must be implemented before backup alerts can send. Live delivery also requires domain verification and publishing.

Feature handlers must send a fixed template to the family's verified recipient, using an idempotency key derived from the reminder event and template. Do not expose a generic endpoint accepting arbitrary recipients or templates. A suppressed recipient is an expected outcome, not a failure to bypass. Rate limits must respect the service's retry interval.

Email does not guarantee attention or immediate delivery, bypass muted notifications, or replace emergency services. The managed unsubscribe footer is mandatory.

For a new domain, start at low volumes: deliverability typically improves over the first 2–4 weeks as receiving providers build trust.