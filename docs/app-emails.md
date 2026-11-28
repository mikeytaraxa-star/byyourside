# App email infrastructure

ByYourSide's sender domain is `notify.byside.here`. At setup it was awaiting DNS verification; check **More → Emails** for its current status and exact DNS records. Verification can take up to 72 hours.

## Enroll a family inbox

1. In the family's @bysappbot chat, send `/email anna@example.com`, replacing the example with an inbox you own.
2. A verification email contains `/email verify XXXXX-XXXXX`. Send that command in the same chat from the same Telegram account within 15 minutes. It approves that inbox to receive the chat's reminder details.
3. `/email` shows masked inbox status. `/email off` removes this chat's backup destination; Telegram continues. This does not change Lovable-hosted unsubscribe or suppression state.

Each chat has one approved backup inbox. A new registration pauses the previous destination until approved; a failed verification-email send preserves the previous destination. New verification requests are limited to one per chat per 15 minutes. Codes are random, stored only as hashes, expire after 15 minutes and cannot be reused. The latest enriched Telegram command event determines enrollment; no schema migration or new email table is needed.

## What is connected

- A server-only managed send helper using runtime credentials, never keys embedded in source or browser code.
- A React Email registry with mailbox-verification and family reminder-alert templates.
- An API-key-protected template preview for More → Emails.
- Managed delivery, retries, rate limits, suppression and unsubscribe handling. No project email queue, email tables or email schedules are required.

The From address is `noreply@notify.byside.here`, with sender name **ByYourSide App**. No recipient is hardcoded; example addresses are not enrollment or consent.

## When alerts send

The existing authenticated reminder check starts email and Telegram in parallel for the same event:

- **15 minutes unconfirmed:** the approved inbox receives the reminder and scheduled time, with a request to check in.
- **Important reminder unconfirmed on a second consecutive day:** email includes the consecutive-day count alongside the stronger Telegram alert.
- **Confirmed reminders, due-time nudges, daily digests and location messages:** no email is sent.

Live sending requires sender-domain verification and publishing. While DNS is pending, `/email` explains why verification mail cannot send and does not enable the destination. After verification, request enrollment again. Previously elapsed alerts are not replayed automatically.

Only feature handlers send fixed templates to the approved recipient. There is no generic browser send endpoint. Event-derived email idempotency keys avoid duplicate email if the Telegram check is retried. Suppression is a normal outcome and is never bypassed. Email failure never prevents Telegram delivery; an email rejected before acceptance is recorded as failed in the authenticated job response, not retried in a project queue. Delivery and retries after acceptance are managed by Lovable. A rate-limited enrollment attempt tells the user the service's retry interval.

Email does not guarantee attention or immediate delivery, bypass muted notifications, or replace emergency services. The managed unsubscribe footer is mandatory.

For a new domain, start at low volumes: deliverability typically improves over the first 2–4 weeks as receiving providers build trust.