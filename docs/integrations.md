# ByYourSide integration setup

The repository contains no provider credentials. The visible demo works without credentials and labels simulated answers and sensor data.

## Telegram

The webhook at `/api/public/telegram/webhook` supports two-way family messages:

- `/remind 14:00 Blue pill — with water`
- `/person Anna | daughter | visits Sundays`
- `/ask What is next?`

Link the Telegram app connector, then register the stable public development URL plus `/api/public/telegram/webhook` with Telegram `setWebhook`. The route verifies Telegram's secret-token header before storing or responding to an update. Care data is service-only; there is no anonymous browser read policy.

## Cocoon AI

`src/lib/cocoon.server.ts` calls an OpenAI-compatible Cocoon client at `/v1/chat/completions`. Supply these values only through server-side connection/secret configuration:

- `COCOON_BASE_URL`: HTTPS URL of the running Cocoon client, without `/v1/chat/completions`.
- `COCOON_API_KEY`: credential for that client or compatible private inference proxy.
- `COCOON_MODEL`: optional; defaults to `Qwen/Qwen3-32B`.

Without configuration, `/ask` returns an explicitly labeled demo answer. Cocoon currently requires a client service rather than offering a universal hosted API key, so a base URL is required in addition to the credential.

## Even Realities G2

The installed `@evenrealities/even_hub_sdk` integration uses the official methods:

- `createStartUpPageContainer` and `textContainerUpgrade` for the clock and reminder display.
- `onEvenHubEvent` for temple/R1 single and double taps, scroll up/down, long-press/release, contextual menu actions, microphone frames, and IMU samples. Source-aware system events distinguish the R1 ring and either temple; older text/list events are honestly labeled G2 input.
- `getAppLocation` and `startAppLocationUpdates` for phone location through Even App.
- `imuControl(true, ImuReportPace.P500)` for head-motion samples.

Use “Connect real G2” only inside Even App 2.2.10 or later. A normal desktop browser cannot access native G2 APIs. “Run sensor demo” uses a fixed example Berlin location and generated IMU values; neither is uploaded or retained.

No medical monitoring, fall detection, or real-time safety guarantee is claimed by this showcase.

## Gesture showcase and voice questions

- Single tap confirms only the currently due reminder; it closes an answer or reminder preview without completing a future reminder.
- Swipe up/down cycles the day's reminders. Double tap returns to the current-day display.
- Long press starts recording; release stops recording and submits the captured question. The paired R1 ring uses the same mapping; the app does not independently pair a ring.
- The G2 contextual menu registers Done, Next reminder, Ask a question, and Today. Ask toggles recording; Stop listening is also available on the phone/browser.
- In a regular browser, on-screen gestures explicitly simulate input, but the microphone captures real audio via permission-gated MediaRecorder. G2 uses audioControl and 16 kHz mono signed 16-bit PCM wrapped as WAV.
- A separate consent checkbox is required before either microphone starts. Speech audio goes to `openai/gpt-transcribe` through the server-only Lovable AI SDK, not Cocoon. No private table reads or audio storage occur. The recording stops after 20 seconds; the server validates format and payload size.
- Transcripts feed grounded local showcase answers from the current reminders and people. These are not claimed as live Cocoon answers. Unknown questions do not invent location, identity, or medical advice.
- Permission denial, no speech, unavailable transcription, and credit errors preserve a typed-question alternative.
- Real hardware behavior requires Even App, compatible firmware, and paired devices; it has not been physically verified in this no-hardware project.
