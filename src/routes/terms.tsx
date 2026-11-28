import { createFileRoute } from "@tanstack/react-router";
import { DocPage } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: "Terms of Service — ByYourSide" },
    { name: "description", content: "Terms for using the ByYourSide demo, Telegram bot and Even G2 companion app." },
    { property: "og:title", content: "Terms of Service — ByYourSide" },
    { property: "og:description", content: "Terms for using the ByYourSide demo, Telegram bot and Even G2 companion app." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Terms,
});

function Terms() {
  return (
    <DocPage title="Terms of Service" intro="Last updated: November 28, 2026. By using ByYourSide (this website, the ByYourSide Telegram bot or the ByYourSide app for Even G2 glasses) you agree to these terms.">
      <section><h2>1. What ByYourSide is</h2><p>ByYourSide is a hackathon prototype that lets family members set gentle reminders and personal notes that are shown on smart glasses. It is provided for demonstration and evaluation only.</p></section>
      <section><h2>2. Not a medical device</h2><p>ByYourSide is not a medical device and does not diagnose, treat, monitor or prevent any condition, including Alzheimer's disease or dementia. It does not replace a caregiver, doctor, pharmacist or emergency service. Never rely on it for medication timing, safety or emergencies. In an emergency, call your local emergency number.</p></section>
      <section><h2>3. No guarantee of delivery</h2><p>Reminders may be late, missed, shown incorrectly or not shown at all — for example when the phone is off, the glasses are disconnected, the app is closed, or a service is unavailable. The glasses app does not run in the background. Server-side Telegram nudges, family alerts and daily summaries are designed as a backup, but delivery is never guaranteed. A confirmation records a tap or /done; it does not verify medication use.</p></section>
      <section><h2>4. Demo content and AI answers</h2><p>Parts of the website are simulations and are labeled as such (for example "DEMO" or "SIMULATED"). Answers labeled "COCOON AI · DEMO" are prepared sample answers. AI answers, when enabled, can be wrong and must not be used for medical, legal or financial decisions.</p></section>
      <section><h2>5. Your responsibilities</h2><ul><li>Only add information about a person with their consent or with lawful authority to act for them.</li><li>Do not enter passwords, bank details or other sensitive data you would not want stored.</li><li>Keep your Telegram account and phone secure.</li><li>Do not misuse, attack, or try to break the service.</li></ul></section>
      <section><h2>6. Privacy</h2><p>Reminders and notes added through the Telegram bot are stored privately for the family circle that created them. Microphone audio in the demo stays on the device and is discarded. Location and motion are off by default. If the family uses /findme and “Phone location” is on in a paired glasses app, the last location is shared with that family circle in Telegram. /findme is not an emergency service — in an emergency, call local emergency services. Motion data stays on the phone. We do not sell personal data.</p></section>
      <section><h2>Family access and personal media</h2><p>The family owner controls invitations, care settings and device access. Only share notes, photographs or recordings with consent or lawful authority. Access codes and invitations must remain private. Owners can export or remove care records in the family workspace. Copies already received through Telegram, email, exports or an offline device cannot be remotely erased by this app.</p><p>Help requests, declined reminders, postponements and family acknowledgements are distinct from completion. They do not prove safety, medication use or clinical outcomes. Quiet periods and connection notices follow family settings; connection is not evidence that glasses are worn.</p></section>
      <section><h2>7. Third-party services</h2><p>ByYourSide works with Telegram, Even Realities glasses and Even App, and optionally Cocoon. Those services have their own terms, and we are not responsible for their availability or behavior.</p></section>
      <section><h2>8. Provided "as is"</h2><p>The service is provided "as is" and "as available", without warranties of any kind. To the fullest extent the law allows, ByYourSide and its creators are not liable for any direct or indirect loss or harm arising from its use, including missed reminders.</p></section>
      <section><h2>9. Changes and ending use</h2><p>We may change or stop the service, or these terms, at any time. Continued use after a change means you accept the updated terms. You can stop using ByYourSide at any time; stop using the bot and uninstall the glasses app.</p></section>
      <section><h2>10. Contact</h2><p>Questions about these terms can be sent to the ByYourSide team through the Telegram bot, <a href="https://t.me/bysappbot" target="_blank" rel="noreferrer">@bysappbot</a>.</p></section>
    </DocPage>
  );
}
