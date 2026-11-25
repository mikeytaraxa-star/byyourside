# A real day with ByYourSide — market research

This document answers the demo-day questions about imperfect, ordinary days and the product's context. ByYourSide is intended to remain free for everyone; it distinguishes implemented behavior from product hypotheses.

## The safety net, in one paragraph

The glasses are the gentlest interface, not the only path. At the due time, the server sends the reminder to the family's Telegram chat whether or not the glasses are being worn. If Your Loved One is in that chat, the same message reaches their phone; otherwise, it reaches the family. After 15 minutes without a glasses tap or `/done`, the family gets a check-in alert. Important reminders created with `/critical` produce a stronger alert when they remain unconfirmed on a second consecutive day. When the glasses app reopens, missed reminders appear first under “EARLIER”. A daily Telegram summary lists confirmed, not-confirmed and upcoming reminders.

## Real-day scenarios

| Situation | What reaches Your Loved One? | What does the family see? | What happens next? |
| --- | --- | --- | --- |
| **Glasses left on the bedside table in the morning** | No glasses prompt. The due-time Telegram message reaches their phone only if they belong to the family bot chat. | The same due-time message, then a 15-minute alert if nobody confirms. | On reopening, the app shows overdue items first. A `/critical` item missed again the next day triggers a second-day alert. |
| **Glasses removed for a shower** | No glasses prompt while removed. Telegram remains the backup path. | Normal due-time and unconfirmed-reminder messages; no special “shower” message. | Catch-up appears when the glasses are put back on. The system does not claim to detect showering or removal. |
| **Glasses charging overnight** | No display, microphone, motion or location from the glasses. Any scheduled Telegram reminder still goes to the configured chat. | Unconfirmed reminders still alert. The default 21:00 local summary shows the day's state before the night. | No overnight wear or safety monitoring is claimed. Families should avoid scheduling glasses-only prompts while the device is charging. |
| **Glasses forgotten on the charger the next morning** | Telegram is again the fallback; there is no glasses display until worn. | The 15-minute alert exposes the gap. Important reminders escalate after a second consecutive unconfirmed day. | Reopening synchronizes the family schedule and presents “EARLIER” items first. |
| **Phone app closed, phone offline, or internet unavailable** | No new server data or location reaches the phone. While the app remains open offline, its last saved reminders are still available. | Server-side Telegram due messages and alerts continue independently of glasses syncing. | The next successful open sync pulls updates and sends pending tap confirmations. No background delivery guarantee is made. |
| **A reminder is completed late** | The wearer or family can use `/done HH:MM`; a due glasses tap also works. | Telegram records the confirmation and the daily summary counts it as confirmed. | A same-day confirmation resets that important reminder's consecutive-miss streak. |
| **A button is tapped but medicine was not actually taken** | No additional verification occurs. | The summary says “confirmed”, not “taken”. | Families must check directly when it matters. ByYourSide is not a medical device or emergency service. |

### What is deliberately not inferred

ByYourSide does **not** detect that glasses were removed, distinguish a shower from charging, prove medication ingestion, diagnose a health change, or replace a call to a caregiver or emergency service. An alert means only that no confirmation was received.

## Daily family summary

- Default: **21:00 in the family's configured time zone**.
- Change it: `/summary 20:30`.
- Disable it: `/summary off`; check the setting with `/summary`.
- Includes every due reminder as **Confirmed** or **Not confirmed**, plus later items as **Still upcoming**.
- “Confirmed” means a tap or `/done` was received; it is not clinical verification.

## Important reminders and repeated misses

Use `/critical 08:00 Blue pill — with water` for medication or another family-designated important routine.

1. Due time: ordinary Telegram nudge.
2. Fifteen minutes unconfirmed: family check-in alert and the first missed day is recorded.
3. A same-day tap or `/done`: the miss streak resets.
4. Fifteen minutes unconfirmed on the next consecutive day: a stronger **SECOND DAY** family alert asks for direct contact or a nearby check-in.

This is intentionally a family-defined escalation, not an automatic medical-risk judgment.

## Market research — desk research, checked 25 November 2026

### Need and care context

The World Health Organization reports **57 million people living with dementia in 2021**, nearly **10 million new cases annually**, and a **US$1.3 trillion global economic cost in 2019**. About half of that cost was attributable to informal carers, who provided an average of five hours of care and supervision per day. This supports the product's focus on reducing family coordination burden. Source: [WHO dementia fact sheet](https://www.who.int/news-room/fact-sheets/detail/dementia).

### Competitor snapshot

| Product | What its own website offers | Relevant difference for ByYourSide |
| --- | --- | --- |
| [Carely](https://usecarely.com/en/) | Phone medication reminders, missed-dose family alerts, history and summaries. Carely+ is free during early access; care-home pricing is a custom quote on its [pricing page](https://usecarely.com/en/pricing/). | ByYourSide's primary wearer interface is an off-centre glasses prompt rather than another phone screen; Telegram is the family interface. |
| [KindLoop](https://kindloop.ai/) | Routine reminders and check-ins through WhatsApp, SMS and email, plus family digests. Its site lists pricing as coming soon. | Similar familiar-messaging philosophy; ByYourSide adds G2/R1 interaction and a Cocoon-ready private-question path. |
| [MemoryCare](https://getmemorycare.app/) | A coming-soon phone app with large text, spoken routines, family dashboard, medication alerts and wellbeing features. | ByYourSide is narrower: glanceable prompts, one-tap confirmation and Telegram rather than a broad wellbeing platform. |

No independent clinical superiority, customer traction or competitor market share is claimed. These are positioning observations from the products' own pages, not hands-on product testing.

### Hardware adoption constraint

Even Realities lists G2 frames **from US$599**, with prescription configuration and accessories potentially adding cost. That is a significant adoption barrier and should be tested explicitly with families. Source: [Even Realities store](https://www.evenrealities.com/store). ByYourSide should not require families to buy hardware before they can evaluate the Telegram reminder and family-summary workflow.

## What to validate next

1. Interview 10–15 dementia family caregivers and 5 care professionals; this desk research is not a substitute for interviews.
2. Test daily glasses use, the Telegram-only fallback and whether hardware cost prevents adoption.
3. Measure confirmation rates, missed important reminders and alert fatigue over a four-week pilot.
4. Ask care professionals which accessibility, privacy and safety improvements would make the free service useful in practice.

**Service status:** ByYourSide is intended to remain free for everyone. No subscriptions, paid licenses or service charges are proposed; third-party hardware and connectivity remain separate.
