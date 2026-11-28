# Everyday companion upgrade

## Available in this release

- `/family`: private family workspace, Today, Routines, Familiar people, Check-ins, History and Settings. Send `/family` privately to @bysappbot for a single-use 15-character access code valid for 10 minutes. The resulting family session lasts 12 hours.
- Signed Telegram Mini App launch validation uses Telegram's production Ed25519 public key, not a raw bot token. Unsigned or stale launch data is rejected. Telegram menu registration awaits publication.
- `/companion`: phone-first view of the same care circle, morning/evening family wording, next-reminder browsing, explicit choices, routine progress and approved reassurance.
- Done, A little later, I need help, Not today, Show again. Help/decline never count as done. Ordinary postponement is explicit; important postponement requires an owner-entered limit. No AI decides medication timing.
- Quiet periods, important exceptions, planned breaks, expected-morning connection notices, first/backup contacts, caregiver acknowledgement and configurable backup delay. Existing 15-minute and second-day alerts remain.
- Family editor previews, dated reminders/routines, media uploads, contact shortcuts, membership invitations, server-side device revocation, export and care-data deletion.
- Private photos/recordings up to 5 MB; signed viewing links expire after two minutes. Phone audio is user-controlled. G2 has no speakers.
- Offline phone reminder choices and G2 action outbox, stable per-action IDs, server-side duplicate prevention, and rejection of previous-day actions instead of applying them to today's medication.
- G2 menu choices preserve tap/swipe/double-tap meanings. Native display stays in the validated regions. Optional reported battery is shown only when supplied by the SDK. Native font sizing is not exposed by SDK 0.0.16; larger text is a phone setting.
- Approved family-note answers without an AI call. Cocoon-compatible live questions and wording drafts stay server-side when configured; drafts require approval before saving. No other AI provider is used.
- User-requested Telegram/email notification readiness test. Accepted means accepted by the service, not delivered/read. Email still requires verified sender and approved mailbox.
- Appointment heads-up: a reminder can carry a family-approved preparation offset (0–180 minutes) shown on the Loved One view and the glasses before it is due. Ordinary confirmations can be grouped into one notice instead of one message each (Settings → ordinary notices), while help requests, missed-reminder alerts and important reminders stay immediate. Each notice records its outcome per recipient.
- Interface languages: 16 languages cover glasses prompts, the Loved One view and family workspace navigation — English, German, Spanish, French, Italian, Portuguese, Dutch, Polish, Ukrainian, Russian, Turkish, Arabic (right-to-left layout), Hindi, Chinese, Japanese and Korean. Choose one in family workspace Settings, or on the glasses companion screen before pairing; a paired family workspace sets the glasses language. Family-written greetings, reminders and notes always stay in the family's own words. Translations other than English are machine-assisted and have not been reviewed by native speakers.

## Permissions

The first verified creator of a care circle becomes owner. Invited editors can edit care records; viewers can view, record wearer choices and acknowledge check-ins. Owner-only actions include invitations, settings, notification recipients, revocation, export and deletion. Revoked members cannot use existing sessions. Care tables have no anonymous/authenticated direct grants; verified server handlers scope every operation to the resolved circle.

Invitation codes expire in 30 minutes and are single-use. Send `/join CODE` privately to the bot. Access and invitation codes are stored as digests. Never send a code to someone claiming to be support. `/family` in a group sends access privately when the member has started the bot.

## Not yet release-complete

The initial upgrade is implemented, but the approved full plan remains open for:

- Telegram Mini App menu registration after publication and a real user `/family`/invitation re-test.
- Physical G2/R1 validation, including native menu capacity, legibility, battery reporting and permissions.
- Appointment preparation offsets, grouped ordinary notices with per-recipient delivery evidence, and offline routine-step replay on G2 are shipped.
- Automatic routine selection and stronger atomic change-history/undo concurrency hardening remain open, alongside wider live media/export/deletion verification.
- Live Cocoon inference and actual speech-to-text, blocked by provider access/capability. Sample microphone capture is not transcription.
- Automated SMS/calls, requiring another provider and approved operating funding; none are presented as working.
- Sender-domain verification, real approved inbox delivery, and consenting family pilots.

The old breakdown PDFs, motion films and narrated film have not been regenerated for these upgrades. Use this document and the current web Docs for accurate feature status.

## Verification completed

126 automated tests passed. Desktop and 390px phone checks exercised the fictional editor, help, caregiver acknowledgement, routines, settings and grounded notes with no page errors or horizontal overflow. An isolated real-data family exercised UI save/reload, paired-device sync, help readback, duplicate action rejection, caregiver acknowledgement, cross-family denial, viewer permission denial, signed-out denial and revoked-device rejection. This is not physical hardware or live family-alert delivery verification.

ByYourSide remains free and is not a medical device or emergency service. No glasses-wear detection, background delivery guarantee, medication-ingestion verification or clinical benefit is claimed.
