import { createFileRoute, Link } from "@tanstack/react-router";
import { DocPage } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [
    { title: "Docs — ByYourSide" },
    { name: "description", content: "What ByYourSide is, how it works, and which Telegram, Even G2 and Cocoon AI integrations are live, demo or planned." },
    { property: "og:title", content: "Docs — ByYourSide" },
    { property: "og:description", content: "What ByYourSide is, how it works, and which Telegram, Even G2 and Cocoon AI integrations are live, demo or planned." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Docs,
});

const status: [string, string, string][] = [
  ["Website demo (chat, glasses view, 3D, full-screen film)", "Working", "Runs in any browser; simulated parts are labeled."],
  ["Even G2 glasses app", "Built", "Installable package with native text display, taps, swipes, ring and menu. Not yet tested on physical glasses."],
  ["G2 / R1 gestures", "Built", "Tap, double tap, swipes, hold. Tested with simulated glasses."],
  ["Microphone", "Built", "Local, consent-gated capture; audio is discarded. No speech-to-text yet."],
  ["Location & head motion", "Built", "Off by default, stays on the phone. No fall detection or geofencing."],
  ["Telegram bot", "Ready, not linked", "Secure webhook, commands and private storage are built; the bot account still needs connecting."],
  ["Cocoon AI (private AI on TON)", "Demo", "Server-side adapter is built; answers are labeled samples until Cocoon access is provided."],
];

function Docs() {
  return (
    <DocPage title="ByYourSide docs" intro="ByYourSide is a gentle memory assistant for people living with dementia. Family adds reminders and familiar facts in Telegram; Your Loved One sees them on Even Realities G2 glasses and confirms with a single tap.">
      <section><h2>How it works</h2><ol><li><strong>Family writes</strong> a reminder or a fact in the ByYourSide Telegram bot.</li><li><strong>The glasses show</strong> one short, warm line in the corner of the right lens — never blocking the view.</li><li><strong>One tap confirms</strong> it, and the family can see it was done.</li><li><strong>Questions</strong> like "Who is Anna?" are answered from what the family has shared, using private AI.</li></ol></section>
      <section><h2>What's integrated</h2>
        <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-sm"><thead className="bg-card"><tr><th className="p-3">Part</th><th className="p-3">Status</th><th className="p-3">Details</th></tr></thead>
        <tbody>{status.map(([a, b, c]) => <tr key={a} className="border-t border-border align-top"><td className="p-3 font-medium">{a}</td><td className="p-3 whitespace-nowrap text-primary">{b}</td><td className="p-3 text-muted-foreground">{c}</td></tr>)}</tbody></table></div>
      </section>
      <section><h2>Telegram commands</h2><ul><li><code>/start</code> — create or join the family circle.</li><li><code>/remind HH:MM text — optional detail</code> — add a daily reminder.</li><li><code>/person Name | relation | note</code> — add a familiar person or fact.</li><li><code>/ask question</code> — ask what the glasses would answer.</li><li><code>/help</code> — list commands.</li></ul></section>
      <section><h2>Glasses controls</h2><p>Tap = done, swipe = browse, double tap = today, hold = ask. The same controls work on the G2 temples and the R1 ring. Full steps are on the <Link to="/install">install page</Link>.</p></section>
      <section><h2>Privacy & safety</h2><ul><li>No passwords or API keys are stored in the app or its code.</li><li>Family data is private to its care circle; nobody else can read it.</li><li>Microphone audio stays on the device and is discarded.</li><li>AI runs on Cocoon, a private, confidential network on TON — no other AI services are used.</li><li>ByYourSide is not a medical device. See the <Link to="/terms">Terms of Service</Link>.</li></ul></section>
      <section><h2>Known limits</h2><ul><li>The glasses app must stay open on the phone; there are no background alerts yet.</li><li>The G2 display is monochrome, so long messages are shortened on the glasses.</li><li>Telegram reminders don't yet sync to the installed glasses app.</li></ul></section>
    </DocPage>
  );
}
