# ByYourSide: everyday companion upgrade

## Goal

Deliver all eight brainstorm areas as one coherent care experience: more independence for Your Loved One, easier family coordination, and dependable, understandable fallbacks. Keep ByYourSide free, retain the Heart in Hand identity, and preserve the existing judge-facing showcase and film.

This is a substantial product expansion, not a collection of cosmetic buttons. Implement it in the sequence below so every new screen is connected to real saved behaviour. Each stage includes the browser showcase, Telegram where applicable, and the shared G2 companion.

## 1. Choices beyond “done”

- Add Done, A little later, I need help, Not today, and Show again.
- Distinguish confirmed, postponed, help requested, declined, and unanswered in the family view and summaries. Declining or asking for help never counts as completion.
- Ordinary reminders allow an explicit postponement choice. Important reminders only allow postponement under a family-configured rule; the app does not choose medication timing.
- Add quiet periods for ordinary prompts, with a separately configured important-reminder policy.
- Keep familiar gesture meanings stable. Provide a short action selector and native menu actions rather than assigning numerous hard-to-remember gestures.
- Make offline actions durable and send them once on reconnection; prevent an older sync response from undoing a newer action.

## 2. Familiar daily routines

- Add a morning orientation using the local day and approved family facts, a What happens next view, and an optional calm evening message.
- Let relatives create reusable routines with ordered steps. Show one step at a time; allow repeat, help, and explicit progress.
- Add appointment preparation prompts, configurable in advance by the family.
- Support date-specific exceptions without changing the recurring routine for tomorrow.
- On reopening, present important overdue items first without flooding the wearer with every missed ordinary prompt.
- Make today's plan understandable on the phone as well as the glasses.

## 3. Familiar people and reassurance

- Add an editable reassurance library: familiar people, relationships, visits, usual object locations, and short answers approved by the family.
- Support questions such as Who is Anna?, What happens next?, and Where are my keys? without visual identification or claims of seeing the surroundings.
- Show the source and last family update where useful; describe an object's usual location rather than asserting its current location.
- Add optional photographs and family-recorded reassurance messages on the companion phone. Keep glasses output short and text-focused.
- Add approved contact shortcuts that open a phone call after an explicit user action; never automatically place calls or claim G2 has speakers.
- Allow updates and removal of personal media, with private storage and scoped access.

## 4. A simpler family workspace in Telegram

- Add a usable family editor that can open inside Telegram as a Mini App, while retaining existing bot commands.
- Provide Today, Routines, Familiar people, Check-ins, and Settings views rather than a marketing landing page.
- Preview the exact glasses message before saving; flag missing times, excessive length, and obvious instruction conflicts without inventing medical guidance.
- Introduce explicit family membership, invitations, and permissions for viewing care information, editing routines, and managing access.
- Let relatives assign responsibility and acknowledge “I'm checking in” independently of completing a reminder.
- Add a caregiver handover briefing, reusable routine templates, change history, deletion confirmation for important items, and safe undo.
- Connect the editor to the existing care circle; do not create a separate, unsynchronized schedule.
- Register the Telegram entry and menu after the new page is published and its verified sign-in works.

## 5. A clearer family safety net

- Preserve the existing 15-minute unconfirmed check-in, second-consecutive-day important-reminder escalation, time zones, and daily summaries.
- Extend summaries and alerts with the new action states and caregiver acknowledgements.
- Let the family choose first and backup recipients, who must accept their invitation and start the bot before receiving direct Telegram messages.
- Add an explicitly configured response ladder. A family acknowledgement records who is responding; it does not claim the wearer is safe.
- Group ordinary notices where appropriate while keeping important alerts separate and preventing duplicate sends.
- Explain why a notice was triggered: unanswered reminder, help request, or missing recent connection.
- Show only delivery evidence actually available: attempted, accepted by the messaging service, failed, or acknowledged by a family member. Do not invent read receipts.
- Add a user-triggered readiness test for enrolled Telegram/email recipients. Email failures must not block Telegram.
- Continue mailbox ownership verification and managed email suppression. Do not introduce promotional email or a custom email queue.
- SMS and automated telephone calls remain unavailable until a suitable provider and operating funding are approved; do not add pretend working controls.

## 6. Life without the glasses

- Show separate last-sync and device-connection information when supported; never label these as proof the glasses are being worn.
- Offer an opt-in expected morning connection check and a factual “hasn't connected” notice when it is missed.
- Add planned breaks and explain which fallback rules continue during them.
- Provide a phone-first companion using the same care-circle schedule, reassurance notes, and reminder actions. No hardware purchase is required to try it.
- Clearly show cached versus freshly synchronized information, pending offline actions, connection failures, and recovery.
- Check the installed G2 SDK for usable battery information. Add charging assistance only if a supported, reliable reading exists.
- Retain the app-open limitation; do not imply guaranteed phone background alerts, removal detection, or overnight monitoring.

## 7. Bounded Cocoon assistance

- Extend the existing server-only Cocoon adapter for grounded questions and family-approved wording drafts.
- Answer only from the caller's authorized care context. Missing facts lead to an honest answer and a family-contact option.
- Draft clearer prompts and flag ambiguity, but require family approval before saving or sending any suggested instruction.
- Keep approved reassurance answers available without live AI, including offline where authorized and cached.
- Protect against instructions embedded in family notes; treat those notes as data, not system instructions.
- Never generate dosing decisions, diagnosis, automatic changes to important routines, invented people, or invented locations.
- Keep Cocoon demo results explicitly labelled until client access is configured and verified. Do not substitute another AI provider.
- Real voice questions require a verified Cocoon-compatible speech capability and separate consent. Preserve today's local capture/discard behaviour until then; do not present sample buttons as transcription.

## 8. Comfort, accessibility, and trust

- Add constrained text-size, display-position, and prompt-duration settings that remain within validated G2 regions.
- Use consistent controls and respectful adult language. No scores, streaks, scolding, or engagement pressure.
- Support familiar names, a family-approved greeting, optional positive family messages, and language selection backed by reviewed interface translations.
- Respect reduced motion and maintain readable phone layouts and non-overlapping glasses prompts.
- Make location, microphone, and personal-media permissions explicit and separately revocable.
- Add family-access removal and server-side paired-device revocation; local Unpair alone is not sufficient for a lost device.
- Explain permission effects and data retention, and offer scoped deletion/export of family information with appropriate confirmation.
- Keep the browser showcase usable without hardware and distinguish simulations from live care data.

## Implementation order

1. **Care foundations:** explicit membership, scoped access, reminder occurrences and action history, safe synchronization, and regression protection for existing alerts.
2. **Wearer experience:** expanded actions, routine steps, orientation, reassurance, accessibility, and phone-first companion.
3. **Family experience:** verified Telegram Mini App, editor, previews, handover, caregiver acknowledgements, and change recovery.
4. **Safety net:** configurable recipients, response ladder, availability notices, quiet periods, and honest delivery status.
5. **Private assistance and media:** grounded Cocoon flows, approved drafts, photographs, recorded family messages, and contact actions.
6. **Release verification:** refresh Even Hub packaging, instructions, privacy/terms, README, feature status, and real-day examples; verify the connected journeys before publishing.

## External dependencies—not silently substituted

| Dependency | What can ship without it | What remains unavailable |
| --- | --- | --- |
| Cocoon client access | Approved notes, deterministic answers, labelled AI examples, adapter and tests | Verified live Cocoon inference |
| Cocoon-compatible speech capability | Typed questions and consent-gated local audio capture | Actual speech-to-text |
| Physical G2/R1 and Even Hub account | Native SDK implementation, package, browser simulation, bridge tests | Physical-device assurance and installation confirmation |
| Verified email sender and mailbox approval | Existing enrollment flow, alert wiring, tests | Confirmed live inbox delivery until tested |
| SMS/calling provider and funding | Approved contact shortcuts and existing Telegram/email channels | Automated SMS and calls |
| Family pilot participants | Product flows and a pilot checklist | Evidence of real-world usability or clinical benefit |

## Technical details

- Preserve TanStack routing, shared pure care logic, the verified Telegram webhook, server-only connector credentials, and the shared G2App/Even Hub entry.
- Extend the existing private care model rather than exposing family tables publicly. Use explicit grants and RLS in every schema change through the managed migration tool.
- Verify Telegram Mini App signed launch data server-side with the supported Telegram validation method; do not trust browser-supplied user IDs, chat IDs, roles, or launch data without verification. Keep connector secrets server-only and confirm a supported secure verification path before enabling live access.
- Store caregiver permissions separately from profiles and enforce them server-side for every action, media read, and export.
- Represent reminder occurrences independently from recurring templates so postponement, quiet periods, day exceptions, and critical-miss history do not overwrite one another.
- Use idempotent, durable action records and atomic alert claims for webhook retries, simultaneous scheduler runs, and reconnects. Persist server state rather than relying on memory.
- Store private photos/recordings separately from public branding, with restrictive policies and short-lived authorized access. Keep all media out of the standalone hardware bundle unless intentionally public.
- Continue using managed email templates and event-derived send identifiers; do not create email-specific tables, queues, or suppression systems.
- Preserve the latest-value display queue and SDK container limits; validate accessibility settings before native writes.
- Add unique page metadata for every new content page. Keep existing shareable films and documents intact; document which older PDFs have not been regenerated.
- Record changed architecture rules in AGENTS.md and track delivery/blockers in roadmap.md.

## Acceptance checks

- Test concrete rules: help/decline are not done, permitted postponement, quiet-period exceptions, dated routine overrides, 15-minute check-ins, second-day escalation, time-zone rollover, and once-only reconnect delivery.
- Test rejected launch signatures, expired sessions/invitations, cross-family reads and writes, unauthorized media, revoked devices, and privilege escalation.
- Test that AI suggestions never auto-save and no other AI provider is called.
- Exercise a real connected family journey: enroll or authorize, edit a reminder, pair the companion, act on it, and read the result back through the family workspace.
- Exercise live Telegram replies and user-approved test alerts; verify live email with the enrolled inbox when sender verification permits it.
- Check phone and desktop layouts, routine navigation, offline recovery, full-screen/3D regression, and native bridge behaviour. Keep hardware-only limitations explicit.
- Refresh the Even Hub package and documentation, run relevant tests, and check preview errors before marking any stage complete.

## Product boundaries

ByYourSide stays free. It is not an emergency service, medical device, medication-ingestion detector, or surveillance system. No automated fall detection, driving guidance, diagnosis, guaranteed background delivery, or glasses-wear detection is included in this upgrade. Those were cautions and research topics, not validated features.