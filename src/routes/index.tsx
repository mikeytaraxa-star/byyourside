import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Glasses3D, GlassesFilm, Hud, ThroughView } from "@/components/demo/Glasses";
import { IntegrationPanel } from "@/components/demo/IntegrationPanel";
import { useEvenHub } from "@/hooks/use-even-hub";
import { useVoiceQuestion } from "@/hooks/use-voice-question";
import { InteractionControls } from "@/components/demo/InteractionControls";
import { browseIndex, type Gesture, type GestureSource } from "@/components/demo/gestures";
import { Button } from "@/components/ui/button";
import logo from "@/assets/byyourside_heart_hand_logo.svg.asset.json";
import {
  answer,
  answerQuestion,
  fmt,
  parseCommand,
  toMin,
  type Msg,
  type Person,
  type Reminder,
} from "@/components/demo/engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ByYourSide — Telegram + smart glasses for dementia care" },
      {
        name: "description",
        content:
          "Family sets reminders in Telegram; Your Loved One sees them on Even G2 glasses and confirms with a tap. Private AI on TON Cocoon.",
      },
      { property: "og:title", content: "ByYourSide — memory assistant on Even G2" },
      {
        property: "og:description",
        content: "Interactive demo: Telegram bot for family, glasses view for the patient.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

let uid = 0;
const id = () => String(++uid);

function Index() {
  const [now, setNow] = useState(toMin("13:58"));
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: id(),
      time: "14:00",
      text: "Blue pill",
      detail: "with a glass of water",
      status: "pending",
    },
    { id: id(), time: "15:00", text: "Dr. Weber", detail: "Peter picks you up", status: "pending" },
  ]);
  const [people, setPeople] = useState<Person[]>([
    { name: "Anna", relation: "daughter", note: "She visits on Sundays." },
    { name: "Peter", relation: "son", note: "He drives you to the doctor." },
  ]);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: id(),
      from: "bot",
      text: "👋 Hi Anna! I'm ByYourSide. I help Your Loved One remember. Add reminders and people below.",
    },
  ]);
  const [override, setOverride] = useState<{ title: string; body: string } | null>(null);
  const [view, setView] = useState<"3d" | "pov">("pov");
  const [input, setInput] = useState("");
  const [film, setFilm] = useState(false);
  const [seen3d, setSeen3d] = useState(false);
  const [lastGesture, setLastGesture] = useState("");
  const [voiceDisplay, setVoiceDisplay] = useState<{ title: string; body: string; footer: string } | null>(null);
  const browseRef = useRef(-1);
  const voiceRef = useRef<{ start: () => Promise<void>; stop: () => Promise<void>; cancel: () => void } | null>(null);
  const confirmationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replaceDisplay = (value: { title: string; body: string } | null) => {
    if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
    confirmationTimer.current = null;
    voiceRef.current?.cancel();
    setVoiceDisplay(null);
    setOverride(value);
  };
  useEffect(() => () => {
    if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
  }, []);
  useEffect(() => {
    if (view === "3d") setSeen3d(true);
  }, [view]);
  const chatRef = useRef<HTMLDivElement>(null);
  const bot = (text: string) => setMsgs((m) => [...m, { id: id(), from: "bot", text }]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: 1e6, behavior: "smooth" });
  }, [msgs]);

  // Escalate reminders unconfirmed for 15+ minutes.
  useEffect(() => {
    reminders.forEach((r) => {
      if (r.status === "pending" && now - toMin(r.time) >= 15) {
        setReminders((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: "missed" } : x)));
        bot(
          `🚨 Your Loved One hasn't confirmed “${r.text}” (due ${r.time}). Maybe give them a call?`,
        );
      }
    });
  }, [now, reminders]);

  const active = useMemo(
    () =>
      reminders
        .filter((r) => r.status === "pending" && toMin(r.time) <= now)
        .sort((a, b) => toMin(a.time) - toMin(b.time))[0],
    [reminders, now],
  );
  const next = reminders
    .filter((r) => r.status === "pending" && toMin(r.time) > now)
    .sort((a, b) => toMin(a.time) - toMin(b.time))[0];

  const hud = voiceDisplay ?? (override
    ? { title: override.title, body: override.body, footer: "tap to close" }
    : active
      ? {
          title: `${active.time} · REMINDER`,
          body: `${active.text}${active.detail ? ` — ${active.detail}` : ""}`,
          footer: "◉ tap  =  Done",
          alert: true,
        }
      : {
          title: "TODAY",
          body: next
            ? `All good ☺  Next: ${next.text} ${next.time}`
            : "All good ☺  Nothing planned",
          footer: "hold to ask a question",
        });

  const send = (text: string) => {
    if (!text.trim()) return;
    browseRef.current = -1;
    replaceDisplay(null);
    setMsgs((m) => [...m, { id: id(), from: "family", text }]);
    const res = parseCommand(text);
    setTimeout(() => {
      if (res.kind === "remind")
        setReminders((r) => [...r, { ...res.reminder, id: id(), status: "pending" }]);
      if (res.kind === "person")
        setPeople((p) => [...p.filter((x) => x.name !== res.person.name), res.person]);
      bot(res.reply);
    }, 350);
    setInput("");
  };

  const tap = () => {
    if (override) return replaceDisplay(null);
    if (!active) return;
    setReminders((rs) => rs.map((x) => (x.id === active.id ? { ...x, status: "done" } : x)));
    replaceDisplay({ title: "THANK YOU", body: "Done ✓  Anna knows." });
    bot(`💚 Your Loved One confirmed “${active.text}” at ${fmt(now)}.`);
    confirmationTimer.current = setTimeout(() => { confirmationTimer.current = null; setOverride(null); }, 2500);
  };

  const ask = (q: "who" | "today") => {
    const visitor = people[0];
    replaceDisplay({
      title: q === "who" ? "WHO IS THIS?" : "WHAT'S NEXT?",
      body: answer(q, people, reminders, now, visitor),
    });
  };

  const askQuestion = (question: string) => {
    browseRef.current = -1;
    replaceDisplay({ title: "COCOON AI · DEMO", body: answerQuestion(question, people, reminders, now) });
  };
  const gesture = (action: Gesture, source: GestureSource, simulated = false) => {
    setLastGesture(`${simulated ? "Simulated" : "Received"} · ${source} · ${action}`);
    if (action === "hold") { void voiceRef.current?.start(); return; }
    if (action === "release") { void voiceRef.current?.stop(); return; }
    if (action === "menu-ask") {
      if (voiceDisplay) void voiceRef.current?.stop(); else void voiceRef.current?.start();
      return;
    }
    if (voiceDisplay) replaceDisplay(null);
    if (action === "tap" || action === "menu-done") { browseRef.current = -1; tap(); return; }
    if (action === "double-tap" || action === "menu-today") { browseRef.current = -1; replaceDisplay(null); return; }
    const sorted = [...reminders].sort((a, b) => toMin(a.time) - toMin(b.time));
    const index = browseIndex(browseRef.current, action === "swipe-up" ? -1 : 1, sorted.length);
    browseRef.current = index;
    const reminder = sorted[index];
    replaceDisplay(reminder ? {
      title: `${reminder.time} · ${index + 1}/${sorted.length}`,
      body: `${reminder.text}${reminder.detail ? ` — ${reminder.detail}` : ""} · ${reminder.status}`,
    } : { title: "TODAY", body: "Nothing planned. Take your time." });
  };

  const g2 = useEvenHub({
    display: { clock: fmt(now), title: hud.title, body: hud.body, footer: hud.footer },
    onGesture: (action, source) => gesture(action, source),
  });
  const voice = useVoiceQuestion(g2, askQuestion);
  voiceRef.current = voice;
  useEffect(() => {
    setVoiceDisplay(voice.status === "listening" ? { title: "MICROPHONE · DEMO", body: "Take your time.", footer: "release for sample answer" }
      : voice.status === "previewing" ? { title: "COCOON AI · DEMO", body: "Showing a sample answer…", footer: "" }
      : voice.status === "requesting" ? { title: "MICROPHONE", body: "Opening the microphone…", footer: "" } : null);
  }, [voice.status]);
  const screen = <Hud {...hud} />;
  const closeFilm = useCallback(() => setFilm(false), []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto max-w-7xl px-5 pb-5 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex shrink-0 items-center gap-3">
            <Logo3D src={logo.url} />
            <p className="font-display text-sm font-bold text-primary">BYYOURSIDE</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/g2">Open G2 app</Link></Button>
            <Button asChild variant="ghost" size="sm"><a href="/downloads/byyourside-g2.ehpk" download>Download G2 package</a></Button>
            <Button asChild variant="ghost" size="sm"><a href="/downloads/g2-setup.md" download>G2 installation guide</a></Button>
          </div>
        </div>
        <h1 className="mt-4 max-w-4xl font-display text-3xl font-bold leading-tight sm:text-4xl">
          Family remembers <span className="text-primary">for</span> Your Loved One — right in front
          of their eyes.
        </h1>
        <p className="mt-2 max-w-5xl text-sm leading-relaxed text-muted-foreground">
          Loved ones add reminders and faces in a Telegram chat. Your Loved One sees one calm line
          on their glasses, taps once, and the family knows it's done. Questions are answered by a
          private AI running on Cocoon.
        </p>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-10 lg:grid-cols-[380px_1fr]">
        {/* Telegram */}
        <div className="mx-auto w-full max-w-[360px] self-start rounded-[3.2rem] bg-gradient-to-b from-muted-foreground/40 to-muted/60 p-[3px] shadow-[0_18px_40px_-18px_oklch(0.1_0.02_50/0.7)]">
          <div className="rounded-[3.05rem] bg-background p-[10px]">
            <div className="relative flex h-[620px] flex-col overflow-hidden rounded-[2.5rem] bg-tg-bg lg:h-[clamp(480px,calc(100svh-270px),660px)]">
              <div className="flex items-center justify-between bg-tg px-7 pt-3 text-[11px] font-semibold text-primary-foreground">
                <span>9:41</span>
                <div className="h-6 w-24 rounded-full bg-background" />
                <span>5G ▮</span>
              </div>
              <div className="flex items-center gap-3 bg-tg px-4 pb-3 pt-2 text-primary-foreground">
                <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-card">
                  <img src={logo.url} alt="" className="h-7 w-7 object-contain" />
                </div>
                <div>
                  <div className="font-semibold">ByYourSide Bot</div>
                  <div className="text-xs opacity-80">Family of Your Loved One · 3 members</div>
                </div>
              </div>
              <div ref={chatRef} className="flex-1 space-y-2 overflow-y-auto p-3">
                {msgs.map((m) => (
                  <div
                    key={m.id}
                    className={`animate-msg-in max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${m.from === "family" ? "ml-auto bg-tg text-primary-foreground" : "bg-tg-bubble"}`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {[
                  "/remind 14:05 Drink water — one full glass",
                  "/person Lena | neighbour | brings the newspaper",
                  "/remind 14:20 Call Anna",
                ].map((c) => (
                  <button
                    key={c}
                    onClick={() => send(c)}
                    className="rounded-full border border-tg/60 px-2.5 py-1 text-xs text-foreground/90 hover:bg-tg/30"
                  >
                    {c.length > 30 ? c.slice(0, 30) + "…" : c}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex gap-2 border-t border-border/50 p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="/remind 18:00 Dinner — soup in fridge"
                  className="flex-1 rounded-full bg-tg-bubble px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button className="rounded-full bg-tg px-4 text-sm font-semibold text-primary-foreground">
                  Send
                </button>
              </form>
              <div className="mx-auto mb-2 h-1 w-28 rounded-full bg-foreground/50" />
            </div>
          </div>
        </div>

        {/* Glasses */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-full border border-border p-1 text-sm">
              {(["pov", "3d"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-full px-4 py-1.5 ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {v === "pov" ? "Through the glasses" : "3D glasses"}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[420px] rounded-3xl border border-border bg-card">
            <div className="relative h-full w-full overflow-hidden rounded-3xl">
              <div
                className={`absolute inset-0 transition-all duration-700 ease-out ${view === "pov" ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-[1.03] [&_*]:!pointer-events-none"}`}
              >
                <ThroughView clock={fmt(now)} onFullscreen={() => setFilm(true)}>
                  {screen}
                </ThroughView>
              </div>
              <div
                className={`absolute inset-0 transition-all duration-700 ease-out ${view === "3d" ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-[0.97] [&_*]:!pointer-events-none"}`}
              >
                {seen3d && <Glasses3D clock={fmt(now)}>{screen}</Glasses3D>}
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Ctl
              onClick={() => gesture("tap", "Right temple", true)}
              label="Tap temple"
              sub={active ? "Confirm reminder" : "Close"}
              primary
            />
            <Ctl onClick={() => { void voice.start(); }} label="Ask a question" sub="Microphone · demo data" />
            <Ctl onClick={() => askQuestion("What's next?")} label="“What's next?”" sub="Sample question · demo" />
            <Ctl
              onClick={() => {
                replaceDisplay(null);
                setNow((n) => n + 5);
              }}
              label="+5 minutes"
              sub="Fast-forward time"
            />
          </div>
          <InteractionControls voice={voice} live={g2.status === "connected"} lastGesture={lastGesture}
            onGesture={(action, source) => gesture(action, source, true)} onQuestion={askQuestion} />
          <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Today
              </h3>
              <ul className="space-y-1 text-sm">
                {[...reminders]
                  .sort((a, b) => toMin(a.time) - toMin(b.time))
                  .map((r) => (
                    <li key={r.id} className="flex justify-between gap-2">
                      <span>
                        <span className="font-mono text-muted-foreground">{r.time}</span> {r.text}
                      </span>
                      <span
                        className={
                          r.status === "done"
                            ? "text-primary"
                            : r.status === "missed"
                              ? "text-destructive"
                              : "text-accent"
                        }
                      >
                        {r.status === "done"
                          ? "✓ done"
                          : r.status === "missed"
                            ? "missed"
                            : "waiting"}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                People Your Loved One knows
              </h3>
              <ul className="space-y-1 text-sm">
                {people.map((p) => (
                  <li key={p.name}>
                    <b>{p.name}</b> <span className="text-muted-foreground">· {p.relation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <IntegrationPanel
        g2={g2}
        onTelegramDemo={() => send("/remind 14:05 Drink water — one full glass")}
        onCocoonDemo={() => ask("today")}
        onSensorDemo={(live = false) =>
          replaceDisplay({
            title: "SENSORS READY",
            body: live ? "G2 location + motion live" : "Location + motion · simulated",
          })
        }
      />

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 sm:grid-cols-3">
        {[
          [
            "1 · Family writes",
            "Anyone in the family Telegram group adds reminders and people with a simple message.",
          ],
          [
            "2 · Your Loved One sees & taps",
            "One short line on the G2 display. A single tap on the glasses confirms it.",
          ],
          [
            "3 · Nobody worries",
            "Family gets “done” instantly — or an alert if a reminder is missed for 15 minutes.",
          ],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-xl font-bold">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
      {film && <GlassesFilm clock={fmt(now)} onClose={closeFilm} />}
    </main>
  );
}

function Ctl({
  label,
  sub,
  onClick,
  primary,
}: {
  label: string;
  sub: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      variant={primary ? "default" : "outline"}
      className="h-auto min-w-0 flex-col items-start whitespace-normal rounded-2xl px-4 py-3 text-left"
    >
      <div className="font-semibold">{label}</div>
      <div className="text-xs opacity-70">{sub}</div>
    </Button>
  );
}

function Logo3D({ src }: { src: string }) {
  const [r, setR] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e: PointerEvent) =>
      setR({
        x: (e.clientY / window.innerHeight - 0.5) * -40,
        y: (e.clientX / window.innerWidth - 0.5) * 50,
      });
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div className="shrink-0 [perspective:600px]">
      <img
        src={src}
        alt="ByYourSide logo"
        className="h-10 w-10 object-contain transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: `rotateX(${r.x}deg) rotateY(${r.y}deg)` }}
      />
    </div>
  );
}
