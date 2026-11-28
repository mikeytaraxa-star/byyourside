import { browseIndex, type Gesture } from '@/components/demo/gestures';
import { toMin, type Reminder } from '@/components/demo/engine';

export type G2Session = { date: string; reminders: Reminder[]; selected: number; sample: boolean };
export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function emptySession(): G2Session { return { date: todayKey(), reminders: [], selected: 0, sample: false }; }
export function restoreSession(raw: string, date = todayKey()): G2Session {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('reminders' in value) || !Array.isArray(value.reminders)) return emptySession();
    const reminders = value.reminders.filter((row): row is Reminder => Boolean(row && typeof row.id === 'string' && typeof row.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(row.time) && typeof row.text === 'string' && row.text.length <= 300 && (row.detail === undefined || typeof row.detail === 'string') && (row.critical === undefined || typeof row.critical === 'boolean') && ['pending', 'done', 'missed'].includes(row.status) && (row.leadMinutes === undefined || (typeof row.leadMinutes === 'number' && row.leadMinutes >= 0 && row.leadMinutes <= 180)))).slice(0, 50);
    const sameDay = 'date' in value && value.date === date;
    return { date, reminders: reminders.map(row => sameDay ? row : { ...row, status: 'pending', careState: 'pending', version: 0 }), selected: 0, sample: 'sample' in value && value.sample === true };
  } catch { return emptySession(); }
}
export function applyG2Gesture(session: G2Session, gesture: Gesture, now: number): G2Session {
  if (gesture === 'swipe-up' || gesture === 'menu-next') return { ...session, selected: browseIndex(session.selected, 1, session.reminders.length) };
  if (gesture === 'swipe-down') return { ...session, selected: browseIndex(session.selected, -1, session.reminders.length) };
  if (gesture === 'double-tap' || gesture === 'menu-today') {
    const due = session.reminders.findIndex(row => row.status === 'pending' && toMin(row.time) <= now);
    const next = session.reminders.findIndex(row => row.status === 'pending');
    return { ...session, selected: Math.max(0, due >= 0 ? due : next) };
  }
  if (gesture === 'tap' || gesture === 'menu-done') {
    const selected = session.reminders[session.selected];
    if (!selected || selected.status !== 'pending' || toMin(selected.time) > now) return session;
    return { ...session, reminders: session.reminders.map(row => row.id === selected.id ? { ...row, status: 'done' } : row) };
  }
  return session;
}
export function dueSelection(session: G2Session, now: number): G2Session {
  const index = session.reminders.findIndex(row => row.status === 'pending' && toMin(row.time) <= now);
  return index >= 0 ? { ...session, selected: index } : session;
}

export const MISSED_AFTER_MINUTES = 15;
/** Minutes still left before a reminder is due, but only inside its family-approved lead window. */
export function prepMinutesLeft(reminder: Reminder | undefined, minute: number): number | null {
  const lead = reminder?.leadMinutes ?? 0;
  if (!reminder || lead <= 0 || reminder.status === 'done') return null;
  const until = toMin(reminder.time) - minute;
  return until > 0 && until <= lead ? until : null;
}
/** Pending reminders more than 15 minutes overdue, earliest first. */
export function missedReminders(session: G2Session, now: number) {
  return session.reminders.filter(row => row.status === 'pending' && row.careState !== 'declined' && now - toMin(row.time) >= MISSED_AFTER_MINUTES).sort((a, b) => Number(b.critical) - Number(a.critical) || toMin(a.time) - toMin(b.time));
}
/** On opening: jump to the earliest missed reminder first, otherwise the earliest due one. */
export function openingSelection(session: G2Session, now: number): G2Session {
  const first = missedReminders(session, now)[0];
  if (first) return { ...session, selected: session.reminders.findIndex(row => row.id === first.id) };
  return dueSelection(session, now);
}
