# ByYourSide on real G2 hardware

## What is built

This is an Even Hub app, not firmware flashed onto the glasses. The installed HTML/JavaScript app runs in **Even App's WebView on the phone**, uses the official G2 SDK bridge, and creates real native text containers on the glasses. The phone must stay connected and the app must remain active; this is not a background reminder service.

The offline installation package is available at `/downloads/byyourside-g2.ehpk`. It contains a complete local application, not a redirect to the showcase. SDK 0.0.16 and the official packer stamp **Even App 2.2.10** as the minimum supported version. The candidate package ID is `app.byyourside.g2`; availability and account ownership are not verified until registration.

## Fast hardware connection

1. Update Even App to 2.2.10 or newer and pair the G2 glasses there. Pair R1 in Even App if using a ring.
2. Use the installed beta build from Even Hub (instructions below), or generate a developer QR for a reachable app address. The current hosted development address returned HTTP 403 during checking, so no working hosted QR is claimed before publication.
3. ByYourSide auto-connects when the native host is ready. If needed, tap **Connect G2**. An ordinary browser never simulates a successful connection.
4. Add a reminder on the phone, or explicitly load the labeled sample schedule. Set a time at or before the current phone clock to test confirmation.
5. Verify the same reminder appears on the physical display and a temple or ring tap marks it done on the phone.

The web `/g2` view can inspect/edit a local schedule without a device; it does not claim that changes reached hardware. The standalone package uses Even App local storage so completion and reminders survive relaunch. Browser preview storage and installed app storage are separate. Neither syncs with Telegram yet.

## Install through Even Hub

Run these commands on your computer, not on the glasses:

```sh
bun install
bun run g2:package
bunx evenhub login
bunx evenhub self-check
bunx evenhub create public/downloads/byyourside-g2.ehpk --name "ByYourSide" --tagline "Gentle reminders for your loved one"
bunx evenhub promote 0.1.0 --to beta
```

Account login is interactive and stays in the CLI's local credentials file, never in source or the package. Register the app and invite beta testers under your Even Hub account. Public catalog release requires Even Hub review. If the candidate package ID is unavailable or your account needs a different namespace, update `g2/app.json` and repack before creating the app. For later releases, bump the manifest version and use `evenhub upload` with a changelog.

To regenerate a development QR after publication:

```sh
bunx evenhub qr --url <public HTTPS app URL>/g2
```

For local testing without publishing, build the package, serve `g2/dist` on your computer, and scan a QR using your computer's LAN IP while the phone is on the same Wi-Fi:

```sh
python3 -m http.server 8000 --bind 0.0.0.0 --directory g2/dist
# In a second terminal:
bunx evenhub qr --url http://YOUR-LAN-IP:8000
```

## Native interactions

- Single tap / menu **Done**: confirms only the selected pending reminder once it is due; future reminders cannot be completed early.
- Swipe up/down: next/previous reminder. Paired R1 uses the same event handler as G2 temple input.
- Double tap / menu **Today**: returns to the earliest due reminder, or the next pending item.
- Long press / release: captures G2 microphone PCM only after explicit local consent; release discards audio. The **Ask a question** menu toggles this same local capture. There is no transcription or inferred answer. Capture stops automatically after 12 seconds, on navigation, or on exit.
- Location/motion: off by default in the hardware app. The switch requests phone location and G2 IMU updates through Even App. Values stay local; no fall detection, geofencing, or emergency monitoring is implemented.

Native display uses a 576 × 288 coordinate space, three nonoverlapping text containers, bounded text, and a latest-value serialized write queue. Long reminder content is truncated **only on the glasses**; full content remains available on the phone. G2 is monochrome, so website colors/3D imagery are not sent to the device.

## Limits and validation

- Local schedule: up to 50 reminders, up to 300 input characters per reminder. Daily completion resets on the phone's local calendar rollover. Scheduling runs only while the application is active; no wake-up, background delivery or missed-reminder family alert is promised.
- Telegram sync is not connected. Existing private family tables remain locked and are not exposed to the installed app. Linking a real care circle needs a separate secure pairing feature.
- Cocoon is not configured. The hardware bundle makes **no AI requests** and contains no service credentials. Cocoon and Telegram remain server-side integrations; neither was replaced by another provider.
- Normal browser, instrumented native bridge, package validation, persistence, and gesture tests are checked. A mocked bridge is not physical hardware verification. Final display legibility, touch behavior, ring delivery, sensor permissions and microphone audio must be checked on G2/R1.

Official references: https://hub.evenrealities.com/docs/ship/packaging and https://hub.evenrealities.com/docs/cli/builds.