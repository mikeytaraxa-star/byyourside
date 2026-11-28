# Language coverage and quality gates

## Available languages

English, German, Spanish, French, Italian, Portuguese (European wording), Dutch,
Polish, Ukrainian, Russian, Turkish, Arabic (Modern Standard Arabic), Hindi,
Chinese (Simplified), Japanese and Korean.

The family language setting governs app-owned wearer prompts and family navigation.
Before pairing, the G2 companion can choose and persist its own language; paired
family preferences override it. Unsupported settings fall back to English.

## Corrected in the audit

- Reviewed every existing dictionary for grammar and care-related meaning.
- Native confirmation statuses no longer claim every task is complete or medication
  ingestion has been independently verified. A localized medication-confirmation
  caveat appears in the wearer view and family day heading.
- Microphone wording identifies local capture, not speech recognition. Permission
  text says audio is discarded and no speech recognition is available.
- Help statuses identify a request; they do not promise receipt, a response or rescue.
- Native menu language changes preserve the nine action IDs and use the same
  serialized latest-value display queue as reminder updates.
- Name matching preserves Unicode letters and combining marks. It no longer strips
  non-Latin names to empty strings or answers from the first unrelated note.
  Ambiguous matches use the localized unknown-answer response, not a guessed person.
- Object notes retain a localized “Usually” qualifier, not a claim of live tracking.
- Long G2 text wraps without splitting emoji, accents or Indic grapheme clusters.
  East Asian glyphs receive a conservative double-width budget. Short native action
  commands fit their existing 22-column region without ellipses.
- Wearer views and family navigation apply `lang` and Arabic right-to-left direction.
  Phone controls wrap instead of overlapping on longer translations.

## Deliberately unchanged

Family-written greetings, reminders, names, instructions and notes are not automatically
translated. Changing a medication instruction without family review is unsafe. This
also means the fictional family's sample care content can remain English when the
interface is changed. There are no translation-service requests or audio uploads.

## Coverage limits — do not claim full-app certification

Some family editor forms, settings explanations, sign-in screens, server delivery and
error messages, Telegram/email templates and historical change labels remain English.
Public documentation, legal pages, PDFs and films are also English. The current
selection does not translate every page of the site or family-authored content.

All translations are authored/reviewed with machine assistance, not signed off by
native speakers or clinical reviewers. “No mistakes can happen” cannot honestly be
guaranteed by automated checks or this audit.

Before use with real families in each locale:

1. Have a native speaker review every message in context, especially medication,
   postponement, help, permissions and safety disclaimers.
2. Complete the English-only interface areas listed above and review them too.
3. Validate fonts, shaping, direction and actual legibility on physical G2 hardware;
   browser screenshots and SDK payload checks cannot certify device font support.
4. Have the family approve its own care content and test comprehension with the wearer.

## Verification

Automated tests check dictionary completeness, interpolation parameters, language
fallback, RTL selection, Unicode question matching, native text bounds and menu-action
identity. Browser checks exercised all 16 G2 language choices and reload persistence
at desktop and phone sizes, plus German family settings and the fictional wearer view.
No G2 page errors or horizontal overflow occurred in those checks. Native menu changes
were verified against a mocked SDK bridge, not physical glasses or a live Telegram family.