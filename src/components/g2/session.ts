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
    const reminders = value.reminders.filter((row): row is Reminder => Boolean(row && typeof row.id === 'string' && typeof row.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(row.time) && typeof row.text === 'string' && row.text.length <= 300 && (row.detail === undefined || typeof row.detail === 'string') && ['pending', 'done', 'missed'].includes(row.status))).slice(0, 50);
    const sameDay = 'date' in value && value.date === date;
    return { date, reminders: reminders.map(row => sameDay ? row : { ...row, status: 'pending' }), selected: 0, sample: 'sample' in value && value.sample === true };
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
