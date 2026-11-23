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
- `onEvenHubEvent` for temple taps and IMU samples.
- `getAppLocation` and `startAppLocationUpdates` for phone location through Even App.
- `imuControl(true, ImuReportPace.P500)` for head-motion samples.

Use “Connect real G2” only inside Even App 2.2.10 or later. A normal desktop browser cannot access native G2 APIs. “Run sensor demo” uses a fixed example Berlin location and generated IMU values; neither is uploaded or retained.

No medical monitoring, fall detection, or real-time safety guarantee is claimed by this showcase.
