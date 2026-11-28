# ByYourSide security, privacy and functionality audit

**Date:** 28 November 2026 UTC  
**Verdict:** Substantially hardened, but not certified 100% safe or fully production-validated. Do not treat the app as a medical, emergency or guaranteed monitoring system.

## Scope and method

- Reviewed authored application logic, public APIs, Telegram and email delivery, family roles/sessions, private storage, device pairing, offline queues, gesture/display/audio lifecycle, localization, routes, shared interface utilities, configuration, packaging and database migrations.
- Independent read-only reviewers covered the family/backend and browser/device areas, followed by shared UI/configuration. Security-sensitive server code was manually reviewed in addition to the platform scans.
- Reviewed generated database/route structure as applicable; generated/minified dependency bundles and binary media were not literally reviewed line by line. Automated advisory scanning is not a supply-chain provenance audit.
- Basic database scan: no reported issues. Production dependency scan: no known vulnerabilities across 62 production dependencies at scan time. Deep scan completed against the pre-audit saved revision and reported two media-access findings.
- Final suite: **226 tests passed across 31 files**, including newly retained regressions and read-only checks against the actual database catalog. No manual app build/typecheck was run; the preview's automatic checks ended with **build OK**.

## Fixed and verified

| Area | Change | Evidence |
|---|---|---|
| Private table access | Removed anonymous and general signed-in direct privileges on all 15 care tables; retained service access and row-level protection | Live catalog tests and basic scan |
| Removed family access | Membership revocation deletes sessions and unused access codes through a database trigger, preventing later reinvitation from reactivating them | Trigger catalog test; authenticated revocation accepted |
| Sign-out | Online sign-out deletes the current server session and clears local family cache and query cache | Authenticated browser sign-out followed by copied-token request returned 401 |
| Instruction recovery | Saves/deletes/history and undo use transactional database functions with row/advisory locks and version checks | Real reminder edit/readback, stale undo rejected, latest undo restored original instruction |
| Full-family deletion | Revokes credentials first, blocks normal access, enumerates the entire private family media prefix and removes identities/records; interrupted cleanup is retried by the existing scheduled job | Authenticated erasure returned success; former owner token rejected; isolated circle count returned zero; orphan-media regression |
| Stored media path | Requires both family and note prefixes before signing/removing a file | Corrupted cross-family path regression; explicit path tests; client roles cannot directly mutate paths |
| Hidden reminder actions | Reassurance screens cannot confirm an unseen reminder | Native-input test: reassurance tap sent no completion |
| Family switching | Unpair clears visible answers, media, question, routines, voice consent, location consent and storage; asynchronous replies are gated by pairing generation | Delayed-question/unpair regression; native persistence reset marker |
| Family clock | Paired due checks use family timezone rather than phone timezone | Berlin-versus-UTC concrete due-time test |
| Legacy completion | Old completion endpoint now requires original date and action key and uses the same occurrence validation | Endpoint regression rejects date-less requests and old-day validation failure |
| Device synchronization | Added request timeout, generation-scoped replay locking, routine queue overlays/persistence and original recurring-time restoration | Routine/session regressions and full suite; physical device unverified |
| Local sensors/audio | Serializes sensor permission changes, rolls back failed enables, ignores late sensor events and stale microphone permission failures | Sensor withdrawal and obsolete recording-request tests |
| Location facts | Rejects missing/string/impossible coordinates and future or invalid freshness timestamps; `/findme` honors family location-sharing preference | Concrete location tests |
| Telegram privacy | Requires recorded `/start` opt-in before processing other commands or sending outbound notifications; minimizes stored update payloads | Signed webhook opt-in regression and integration tests |
| Provider errors | Removes raw Telegram/Cocoon provider error bodies from logs/responses; Cocoon requires HTTPS | Provider-body leakage and insecure-endpoint tests |
| Care facts | Telegram question context excludes deleted and other-date reminders, and uses today's confirmation rather than stale recurring status; demo person names no longer match substrings or ambiguous multiple people | Name-matching regressions; code review |
| Export | Separately paginates retained care tables instead of exporting only a limited today screen | Authenticated downloaded export included real saved test reminder |
| Response privacy | Adds no-store to private responses/pages, no-referrer and nosniff; rejects declared oversized public request bodies | Browser HTTP header checks |

## End-to-end checks

Used a synthetic, private test family—not real family data—with no recorded Telegram opt-in, so no real people were messaged.

1. Signed into the family workspace using a temporary test session.
2. Saved a reminder through the actual family form and read it back in the UI.
3. Opened the companion and read the same private reminder.
4. Downloaded the record export and verified the reminder was present.
5. Signed out and confirmed that the copied session was refused.
6. With a fresh isolated session, verified newer instruction preservation, rejected stale undo and successful current undo.
7. Revoked a synthetic viewer, checked the mobile family view for horizontal overflow, erased the test family and verified its former owner token no longer worked.
8. Confirmed `/`, `/g2`, family pages, companion, docs, install, terms, demo video and breakdown loaded without browser runtime errors.
9. Unauthenticated workspace, G2 sync/action/done/support, Telegram webhook and scheduled job requests all returned 401; managed email preview also returned 401.

All final isolated test family records were removed. Earlier attempted direct database mutation tests were replaced by read-only catalog tests because the test connection intentionally lacks direct private table privileges; they are not presented as successful mutation verification.

## Deep scan findings

1. **Cross-family stored media path — originally Critical:** the report proposed a client-mutated path reaching privileged signing. Live row-level policy inspection showed no client care-table policies, and the audit additionally revoked client table grants and validates the exact family/note prefix. This is defense in depth; the scanner's claimed client-write path was not demonstrated against live access controls. The code boundary was hardened rather than ignored.
2. **Already-issued media link survives removal — Warning retained:** an authorized member's signed link can work for up to **120 seconds after revocation**. Removing membership prevents new links, not previously issued capabilities or files already downloaded. This remains disclosed and unresolved; no finding was hidden.

## Remaining risks and unfinished acceptance

### Privacy and reliability limits

- Offline care facts and device bearer tokens intentionally persist on the companion phone. A person with access to an unlocked phone or compromised same-origin script may read them. Remote revocation cannot recall downloaded media or offline screenshots/caches.
- Offline logout cannot invalidate the server session until contact resumes; expiry or owner revocation bounds copied-token access.
- The two-minute signed-media-link window is not immediate revocation. A request-time authenticated streaming media proxy would be needed to remove that capability window; already downloaded bytes can never be recalled.
- Single-note deletion retains recoverable history and may retain its private media for undo until full-family erasure. Provider email/Telegram delivery logs and backups have separate retention outside app erasure.
- Edit/undo is now atomic, but all caregiver operations and storage writes are not one distributed transaction. Requests already in progress during revocation/deletion remain a concurrency-hardening area; an external file operation cannot be made atomic with a database change by these fixes alone.
- Digest claims and failed escalation release were improved, but process crashes between claiming and delivery can still leave work pending, and partial-recipient retries can duplicate messages. A durable recipient-level delivery lease/outbox is not complete.
- Public endpoints do not implement a comprehensive durable rate limiter. Random pairing/access codes resist practical guessing, but request-cost abuse and per-recipient mailbox-verification abuse still need production limits and monitoring. The declared-body limit does not fully protect absent/chunked body lengths.
- Exports paginate records but are not a consistent point-in-time backup under concurrent editing; media bytes, delivery provider logs and credentials are not included.
- Cocoon system instructions are not a formal hallucination or prompt-injection guarantee. Live provider output requires clinical/safety validation; no medical advice or altered medication instructions should be trusted.
- Shared chart utility uses raw style HTML, but no chart consumer or user-controlled chart configuration was found in the app. This is not a demonstrated app exploit; future consumers must keep configuration trusted or remove the raw sink.

### Features not certified as fully functional

- **Telegram Mini App:** the published `/family` destinations returned 200 during this audit, improving the previously documented missing-page state. The Open ByYourSide menu configuration and actual Telegram opening/invitation acceptance still need a consenting second Telegram account and real-client testing; they were not changed in this audit.
- **Email:** enrollment and scheduled send paths pass isolated tests, but verified sender DNS, inbox approval and an actual delivered missed-reminder email are not established by this audit.
- **Cocoon:** credentials/access remain unconfigured; live private model answers were not tested. No substitute AI provider was introduced.
- **Speech:** microphone capture is not speech recognition; sample questions and approved family notes remain distinct from actual transcription.
- **Physical G2/R1:** native integration is tested with SDK doubles and the refreshed downloadable package, not actual glasses/ring acceptance. Native storage reset, consent, glyph rendering, display timing and phone variations need hardware testing.
- **Localization:** 16 catalogs pass automated consistency checks, not native-speaker or clinical review. Some app forms/messages remain English.
- **Care display:** automatic routine selection, complete preparation-priority selection, native reading-position preferences and planned-break behavior are not all complete. The existing roadmap records these limitations.
- **Operational safety:** monitoring, incident response, backup restoration, formal retention guarantees, load testing, penetration testing and independent clinical review are not certified here.

## Deployment

Database hardening migrations apply to the connected backend immediately. App code fixes require publication to reach the public deployment; this audit did **not** publish automatically. The downloadable G2 package was regenerated from the updated browser-safe companion.

**Bottom line:** tests and scans provide evidence, not a promise of zero vulnerabilities or guaranteed care delivery. Complete external and clinical acceptance before relying on ByYourSide for real-world dementia care.