import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Glasses3D, Hud, ThroughView } from "@/components/demo/Glasses";
import { answer, fmt, parseCommand, toMin, type Msg, type Person, type Reminder } from "@/components/demo/engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recall — Telegram + smart glasses for dementia care" },
      { name: "description", content: "Family sets reminders in Telegram; Mom sees them on Even G2 glasses and confirms with a tap. Private AI on TON Cocoon." },
      { property: "og:title", content: "Recall — memory assistant on Even G2" },
      { property: "og:description", content: "Interactive demo: Telegram bot for family, glasses view for the patient." },
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
    { id: id(), time: "14:00", text: "Blue pill", detail: "with a glass of water", status: "pending" },
    { id: id(), time: "15:00", text: "Dr. Weber", detail: "Peter picks you up", status: "pending" },
  ]);
  const [people, setPeople] = useState<Person[]>([
    { name: "Anna", relation: "daughter", note: "She visits on Sundays." },
    { name: "Peter", relation: "son", note: "He drives you to the doctor." },
  ]);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: id(), from: "bot", text: "👋 Hi Anna! I'm Recall. I help Mom remember. Add reminders and people below." },
  ]);
  const [override, setOverride] = useState<{ title: string; body: string } | null>(null);
  const [view, setView] = useState<"3d" | "pov">("pov");
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const bot = (text: string) => setMsgs((m) => [...m, { id: id(), from: "bot", text }]);

  useEffect(() => { chatRef.current?.scrollTo({ top: 1e6, behavior: "smooth" }); }, [msgs]);

  // Escalate reminders unconfirmed for 15+ minutes.
  useEffect(() => {
    reminders.forEach((r) => {
      if (r.status === "pending" && now - toMin(r.time) >= 15) {
        setReminders((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: "missed" } : x)));
        bot(`🚨 Mom hasn't confirmed “${r.text}” (due ${r.time}). Maybe give her a call?`);
      }
    });
  }, [now, reminders]);

  const active = useMemo(
    () => reminders.filter((r) => r.status === "pending" && toMin(r.time) <= now).sort((a, b) => toMin(a.time) - toMin(b.time))[0],
    [reminders, now],
  );
  const next = reminders.filter((r) => r.status === "pending" && toMin(r.time) > now).sort((a, b) => toMin(a.time) - toMin(b.time))[0];

  const hud = override
    ? { title: override.title, body: override.body, footer: "tap to close" }
    : active
      ? { title: `${active.time} · REMINDER`, body: `${active.text}${active.detail ? ` — ${active.detail}` : ""}`, footer: "◉ tap  =  Done", alert: true }
      : { title: fmt(now), body: next ? `All good ☺  Next: ${next.text} ${next.time}` : "All good ☺  Nothing planned", footer: "ring: ask a question" };

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { id: id(), from: "family", text }]);
    const res = parseCommand(text);
    setTimeout(() => {
      if (res.kind === "remind") setReminders((r) => [...r, { ...res.reminder, id: id(), status: "pending" }]);
      if (res.kind === "person") setPeople((p) => [...p.filter((x) => x.name !== res.person.name), res.person]);
      bot(res.reply);
    }, 350);
    setInput("");
  };

  const tap = () => {
    if (override) return setOverride(null);
    if (!active) return;
    setReminders((rs) => rs.map((x) => (x.id === active.id ? { ...x, status: "done" } : x)));
    setOverride({ title: "THANK YOU", body: "Done ✓  Anna knows." });
    bot(`💚 Mom confirmed “${active.text}” at ${fmt(now)}.`);
    setTimeout(() => setOverride(null), 2500);
  };

  const ask = (q: "who" | "today") => {
    const visitor = people[0];
    setOverride({ title: q === "who" ? "WHO IS THIS?" : "WHAT'S NEXT?", body: answer(q, people, reminders, now, visitor) });
  };

  const screen = <Hud {...hud} />;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto max-w-7xl px-5 pb-6 pt-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Even Realities G2 · Telegram · TON Cocoon</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
          Family remembers <span className="text-primary">for</span> Mom — right in front of her eyes.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Loved ones add reminders and faces in a Telegram chat. Mom sees one calm line on her glasses, taps once, and the family knows it's done. Questions are answered by a private AI running on Cocoon.
        </p>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-10 lg:grid-cols-[380px_1fr]">
        {/* Telegram */}
        <div className="flex h-[640px] flex-col overflow-hidden rounded-3xl border border-border bg-tg-bg shadow-2xl">
          <div className="flex items-center gap-3 bg-tg px-4 py-3 text-primary-foreground">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-background/20 font-bold">R</div>
            <div><div className="font-semibold">Recall Bot</div><div className="text-xs opacity-80">Family of Mom · 3 members</div></div>
          </div>
          <div ref={chatRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            {msgs.map((m) => (
              <div key={m.id} className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${m.from === "family" ? "ml-auto bg-tg text-primary-foreground" : "bg-tg-bubble"}`}>{m.text}</div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {["/remind 14:05 Drink water — one full glass", "/person Lena | neighbour | brings the newspaper", "/remind 14:20 Call Anna"].map((c) => (
              <button key={c} onClick={() => send(c)} className="rounded-full border border-tg/60 px-2.5 py-1 text-xs text-foreground/90 hover:bg-tg/30">{c.length > 30 ? c.slice(0, 30) + "…" : c}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-border/50 p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="/remind 18:00 Dinner — soup in fridge" className="flex-1 rounded-full bg-tg-bubble px-4 py-2 text-sm outline-none placeholder:text-muted-foreground" />
            <button className="rounded-full bg-tg px-4 text-sm font-semibold text-primary-foreground">Send</button>
          </form>
        </div>

        {/* Glasses */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-full border border-border p-1 text-sm">
              {(["pov", "3d"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`rounded-full px-4 py-1.5 ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {v === "pov" ? "Through the glasses" : "3D glasses"}
                </button>
              ))}
            </div>
            <div className="font-mono text-sm text-muted-foreground">🕑 {fmt(now)}</div>
          </div>
          <div className="h-[420px] rounded-3xl border border-border bg-card">
            {view === "pov" ? <ThroughView>{screen}</ThroughView> : <Glasses3D>{screen}</Glasses3D>}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Ctl onClick={tap} label="Tap temple" sub={active ? "Confirm reminder" : "Close"} primary />
            <Ctl onClick={() => ask("who")} label="“Who is this?”" sub="Voice question" />
            <Ctl onClick={() => ask("today")} label="“What's next?”" sub="Voice question" />
            <Ctl onClick={() => { setOverride(null); setNow((n) => n + 5); }} label="+5 minutes" sub="Fast-forward time" />
          </div>
          <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Today</h3>
              <ul className="space-y-1 text-sm">
                {[...reminders].sort((a, b) => toMin(a.time) - toMin(b.time)).map((r) => (
                  <li key={r.id} className="flex justify-between gap-2"><span><span className="font-mono text-muted-foreground">{r.time}</span> {r.text}</span>
                    <span className={r.status === "done" ? "text-primary" : r.status === "missed" ? "text-destructive" : "text-accent"}>{r.status === "done" ? "✓ done" : r.status === "missed" ? "missed" : "waiting"}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">People Mom knows</h3>
              <ul className="space-y-1 text-sm">{people.map((p) => <li key={p.name}><b>{p.name}</b> <span className="text-muted-foreground">· {p.relation}</span></li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 sm:grid-cols-3">
        {[
          ["1 · Family writes", "Anyone in the family Telegram group adds reminders and people with a simple message."],
          ["2 · Mom sees & taps", "One short line on the G2 display. A single tap on the glasses confirms it."],
          ["3 · Nobody worries", "Family gets “done” instantly — or an alert if a reminder is missed for 15 minutes."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-5"><h3 className="font-display text-xl font-bold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></div>
        ))}
      </section>
    </main>
  );
}

function Ctl({ label, sub, onClick, primary }: { label: string; sub: string; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 ${primary ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>
      <div className="font-semibold">{label}</div><div className="text-xs opacity-70">{sub}</div>
    </button>
  );
}
