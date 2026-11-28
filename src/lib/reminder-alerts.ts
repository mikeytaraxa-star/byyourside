// Pure scheduling rules for Telegram backup messages (shared by the cron route and tests).
export const ALERT_AFTER_MINUTES = 15;

export type AlertReminder = {
  id: string;
  local_time: string;
  title: string;
  detail: string | null;
  nudged_on: string | null;
  alerted_on: string | null;
  confirmed_on: string | null;
  critical: boolean;
  missed_streak: number;
  last_missed_on: string | null;
  care_state?: string;
  effective_time?: string;
};
export type AlertAction = { id: string; kind: 'nudge' | 'alert' | 'critical'; text: string; missedStreak?: number };
export type SummaryReminder = Pick<AlertReminder, 'local_time' | 'title' | 'confirmed_on' | 'critical' | 'care_state' | 'effective_time'>;

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return (h ?? 0) * 60 + (m ?? 0); };

/** Local date (YYYY-MM-DD) and minute-of-day for an IANA time zone; falls back to UTC. */
export function localClock(now: Date, timeZone: string): { date: string; minute: number } {
  let parts: Intl.DateTimeFormatPart[];
  try { parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now); }
  catch { return localClock(now, 'UTC'); }
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minute: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function isValidTimeZone(tz: string) { try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; } }

export function previousDate(today: string) {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** What to send now: a nudge when due, then a family alert 15 minutes later if still unconfirmed. */
export function alertActions(reminders: AlertReminder[], today: string, minute: number): AlertAction[] {
  const out: AlertAction[] = [];
  for (const r of reminders) {
    if (r.confirmed_on === today) continue;
    if (r.care_state === 'declined' && !r.critical) continue;
    const late = minute - toMin(r.effective_time ?? r.local_time);
    const time = r.local_time.slice(0, 5);
    if (late >= ALERT_AFTER_MINUTES) {
      if (r.alerted_on === today) continue;
      if (r.critical) {
        const missedStreak = (r.last_missed_on === previousDate(today) ? r.missed_streak : 0) + 1;
        if (missedStreak >= 2) {
          const label = missedStreak === 2 ? 'SECOND DAY' : `${missedStreak} DAYS IN A ROW`;
          out.push({ id: r.id, kind: 'critical', missedStreak, text: `🚨 ${label} · ${r.title} (${time}) is still unconfirmed.\nThis important reminder was also missed yesterday. Please contact Your Loved One directly or ask someone nearby to check in.\nReply /done ${time} once it's done.` });
          continue;
        }
        out.push({ id: r.id, kind: 'alert', missedStreak, text: `⚠️ Important: ${r.title} not confirmed yet (due ${time}).\nCould someone check in? Reply /done ${time} once it's done.` });
        continue;
      }
      out.push({ id: r.id, kind: 'alert', text: `⚠️ ${r.title} not confirmed yet (due ${time}).\nCould someone check in? Reply /done ${time} once it's done.` });
    } else if (late >= 0 && r.nudged_on !== today) {
      out.push({ id: r.id, kind: 'nudge', text: `⏰ ${time} · ${r.title}${r.detail ? ` — ${r.detail}` : ''}\nReply /done ${time} when it's done.` });
    }
  }
  return out;
}

/** One local-time summary per family per day; "off" disables it. */
export function shouldSendSummary(summaryTime: string, sentOn: string | null, today: string, minute: number) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(summaryTime) && sentOn !== today && minute >= toMin(summaryTime);
}

/** A factual digest: confirmation means a tap or /done, never proof that medication was taken. */
export function dailySummary(reminders: SummaryReminder[], today: string, minute: number) {
  const due = reminders.filter(r => toMin(r.local_time) <= minute);
  const confirmed = due.filter(r => r.confirmed_on === today);
  const missed = due.filter(r => r.confirmed_on !== today);
  const upcoming = reminders.filter(r => toMin(r.local_time) > minute);
  const line = (r: SummaryReminder, symbol: string) => `${symbol} ${r.local_time.slice(0, 5)} ${r.critical ? '❗ ' : ''}${r.title.slice(0, 60)}`;
  const lines = [
    `🌙 ByYourSide · Daily summary · ${today}`,
    '',
    `✅ Confirmed: ${confirmed.length}`,
    `⚠️ Not confirmed: ${missed.length}`,
    `⏳ Still upcoming: ${upcoming.length}`,
    '',
    ...confirmed.map(r => line(r, '✅')),
    ...missed.map(r => line(r, '⚠️')),
    ...upcoming.map(r => line(r, '⏳')),
    ...reminders.filter(r => r.care_state && r.care_state !== 'pending' && r.care_state !== 'done').map(r => `${r.local_time.slice(0, 5)} ${r.title.slice(0, 60)} — ${r.care_state === 'help' ? 'Help requested' : r.care_state === 'declined' ? 'Declined (not confirmed)' : 'Postponed'}`),
    '',
    'Confirmed means a glasses tap or /done was received; it does not verify that medicine was taken.',
  ];
  return lines.join('\n');
}

/** Parse "/done 08:00" (or "/done" for the most recent due one). */
export function parseDone(text: string): { time: string | null } | null {
  const m = text.trim().match(/^\/done(?:@\w+)?(?:\s+(\d{1,2}):(\d{2}))?\s*$/i);
  if (!m) return null;
  return { time: m[1] ? `${m[1].padStart(2, '0')}:${m[2]}` : null };
}

/** How long a bundled family update waits so a burst of routine taps becomes one message. */
export const DIGEST_AFTER_MINUTES = 10;
export const GROUPABLE_KINDS = ['done', 'later', 'decline', 'repeat', 'routine-step'] as const;
const digestWord: Record<string, string> = { done: 'Confirmed', later: 'A little later', decline: 'Not today', repeat: 'Shown again', 'routine-step': 'Routine step' };
const digestSymbol: Record<string, string> = { done: '✅', later: '⏳', decline: '✖️', repeat: '🔁', 'routine-step': '✓' };

/** One calm digest of routine confirmations. Important alerts never wait for this. */
export function digestText(events: { kind: string; label: string; created_at: string }[], date: string) {
  const line = (e: { kind: string; label: string; created_at: string }) => {
    const at = new Date(e.created_at);
    const clock = Number.isFinite(at.getTime()) ? at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    return `${digestSymbol[e.kind] ?? '•'} ${clock} ${(digestWord[e.kind] ?? 'Update').slice(0, 20)} · ${e.label.slice(0, 60)}`;
  };
  return [
    `📋 ByYourSide · Family updates · ${date}`,
    '',
    ...events.map(line),
    '',
    'Routine confirmations are bundled so your family chat stays calm. Important alerts still arrive immediately.',
  ].join('\n');
}
