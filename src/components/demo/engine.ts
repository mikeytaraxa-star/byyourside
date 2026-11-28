export type Reminder = { id: string; time: string; originalTime?: string; text: string; detail?: string; critical?: boolean; status: "pending" | "done" | "missed"; careState?: 'pending'|'done'|'postponed'|'help'|'declined'; snoozeMinutes?: number; version?: number; leadMinutes?: number };
export type Person = { name: string; relation: string; note: string };
export type Msg = { id: string; from: "family" | "bot"; text: string };

export function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
export function fmt(min: number) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Parses family commands. Returns what to add plus the bot reply. */
export function parseCommand(input: string):
  | { kind: "remind"; reminder: Omit<Reminder, "id" | "status">; reply: string }
  | { kind: "person"; person: Person; reply: string }
  | { kind: "error"; reply: string } {
  const t = input.trim();
  const r = t.match(/^\/(remind|critical)(?:@\w+)?\s+(\d{1,2}):(\d{2})\s+(.+)$/i);
  if (r) {
    const h = Number(r[2]), m = Number(r[3]);
    if (h > 23 || m > 59) return { kind: "error", reply: "⚠️ That time doesn't look right. Try /remind 14:00 Blue pill" };
    const [text, detail] = (r[4] ?? "").split(/\s+[—-]\s+/);
    const time = fmt(h * 60 + m);
    const critical = r[1]?.toLowerCase() === "critical";
    return {
      kind: "remind",
      reminder: { time, text: (text ?? "").trim(), ...(detail ? { detail: detail.trim() } : {}), ...(critical ? { critical: true } : {}) },
      reply: critical
        ? `❗ Important reminder set for ${time}: “${text?.trim()}”. If it stays unconfirmed on a second day in a row, I'll send a stronger family alert.`
        : `✅ Reminder set for ${time}: “${text?.trim()}”. I'll tell you when it's done.`,
    };
  }
  const p = t.match(/^\/person\s+(.+)$/i);
  if (p) {
    const [name, relation, note] = (p[1] ?? "").split("|").map((x) => x.trim());
    if (!name || !relation) return { kind: "error", reply: "⚠️ Use: /person Anna | daughter | visits on Sundays" };
    return { kind: "person", person: { name, relation, note: note ?? "" }, reply: `👤 Saved ${name} (${relation}). Your Loved One can now ask “Who is ${name}?”` };
  }
  return { kind: "error", reply: "I understand:\n/remind 14:00 Blue pill — with water\n/critical 08:00 Blue pill — with water\n/person Anna | daughter | visits Sundays" };
}

/** Simple on-device answer used for the demo; in production this goes to the private AI. */
export function answer(q: "who" | "today" | "where", people: Person[], reminders: Reminder[], now: number, visitor?: Person) {
  if (q === "who") return visitor ? `${visitor.name}, your ${visitor.relation}. ${visitor.note}` : "I don't know yet. Ask family to add them.";
  if (q === "today") {
    const next = reminders.filter((r) => r.status === "pending" && toMin(r.time) >= now).sort((a, b) => toMin(a.time) - toMin(b.time))[0];
    return next ? `Next: ${next.text} at ${next.time}.` : "Nothing else today. Relax ☺";
  }
  return "You're at home. Peter is nearby.";
}

/** Grounded showcase answers, not a live AI call or visual person identification. */
export function answerQuestion(question: string, people: Person[], reminders: Reminder[], now: number) {
  const lower = question.toLowerCase();
  const matches = people.filter(p => {
    const name=p.name.trim().toLowerCase();if(!name)return false;
    const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`,'u').test(lower);
  });
  if(matches.length>1)return 'Please ask about one person by their full name.';
  const person = matches[0];
  if (person) return answer("who", people, reminders, now, person);
  if (/\b(who|person|visitor)\b/.test(lower)) return "I can't identify someone through the glasses. Ask their name; I can tell you what your family shared about them.";
  if (/\b(next|today|reminder|planned|schedule)\b/.test(lower)) {
    const due = reminders.filter((r) => r.status === "pending" && toMin(r.time) <= now).sort((a, b) => toMin(a.time) - toMin(b.time))[0];
    return due ? `${due.text} was planned for ${due.time}.${due.detail ? ` ${due.detail}.` : ""}` : answer("today", people, reminders, now);
  }
  return "I can help with today's reminders or someone your family has added. For anything else, please check with your loved ones.";
}
