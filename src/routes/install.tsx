import { createFileRoute, Link } from "@tanstack/react-router";
import { DocPage } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/install")({
  head: () => ({ meta: [
    { title: "Install & how to use — ByYourSide" },
    { name: "description", content: "Step-by-step: install the ByYourSide app on Even G2 glasses, set up the Telegram bot and use taps and swipes." },
    { property: "og:title", content: "Install & how to use — ByYourSide" },
    { property: "og:description", content: "Step-by-step: install the ByYourSide app on Even G2 glasses, set up the Telegram bot and use taps and swipes." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Install,
});

function Install() {
  return (
    <DocPage title="Install & how to use" intro="Set up ByYourSide in a few minutes: the family uses Telegram, and Your Loved One wears Even G2 glasses.">
      <section><h2>Try without glasses</h2><p>Open the <Link to="/family">family workspace</Link> and choose a fictional family, or send <code>/family</code> privately to @bysappbot for access to your real care circle. Use <Link to="/companion">Loved One view</Link> on the phone. Glasses are optional for this experience.</p><p>Owners invite relatives from Settings. Invited relatives send <code>/join CODE</code> privately to the bot. Never share access or pairing codes with anyone claiming to be support.</p></section>
      <section><h2>What you need</h2><ul><li>Even Realities G2 glasses (an R1 ring is optional).</li><li>A phone with <strong>Even App 2.2.10 or newer</strong>, paired with the glasses.</li><li>Telegram on each family member's phone.</li></ul></section>
      <section><h2>1. Download the glasses app</h2><p><a href="/downloads/byyourside-g2.ehpk" download>Download ByYourSide for G2 (.ehpk)</a> — a complete offline app package with no accounts or keys inside.</p><p>Install it through Even Hub as a beta app (developer account needed while it awaits store review), or follow the <a href="/downloads/g2-setup.md">full hardware setup guide</a>. You can also open the <Link to="/g2">web version of the glasses app</Link> to try it in a browser.</p></section>
      <section><h2>2. Connect the glasses</h2><ol><li>Open Even App and make sure the G2 glasses are connected.</li><li>Launch ByYourSide from Even Hub. It connects to the glasses automatically; tap <strong>Connect G2</strong> if it doesn't.</li><li>Keep the phone nearby and the app open — reminders show while the app is running.</li></ol></section>
      <section><h2>3. Family: set up the Telegram bot</h2><ol><li>Open <a href="https://t.me/bysappbot" target="_blank" rel="noreferrer">@bysappbot</a> in Telegram and press <strong>Start</strong>.</li><li>Add a reminder, e.g. <code>/remind 08:00 Blue pill — on the kitchen table</code>.</li><li>Add people and facts, e.g. <code>/person Anna | daughter | lives in New York</code>.</li><li>Send <code>/pair</code> and enter the 10-character code once in the glasses app to sync reminders and taps.</li><li>Turn on <strong>Phone location</strong> in the glasses app if the family should be able to use <code>/findme</code> to see where Your Loved One is.</li><li>Type <code>/help</code> for all commands.</li></ol><p>The bot is connected. Publish new updates before using newly added commands. The home-page chat remains a fictional showcase.</p></section>
      <section><h2>4. Using the glasses</h2><ul><li><strong>Tap</strong> (temple or ring): mark the current reminder done.</li><li><strong>Swipe up / down</strong>: next or previous reminder.</li><li><strong>Double tap</strong>: back to today's next reminder.</li><li><strong>Press and hold</strong>: test local microphone capture (asks for permission first; audio is discarded, not transcribed).</li></ul><p>Messages appear small, in the upper corner of the right lens, so they never block the view.</p></section>
      <section><h2>Troubleshooting</h2><ul><li>Nothing on the glasses? Check they are connected in Even App and ByYourSide is open.</li><li>Reminder won't mark done? Only reminders that are due can be confirmed.</li><li>Still stuck? See the <Link to="/docs">docs</Link>.</li></ul></section>
    </DocPage>
  );
}
