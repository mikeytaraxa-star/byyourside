import { toMin, fmt } from '@/components/demo/engine';
import { isLanguage } from '@/lib/i18n';
import { defaultPreferences, type CareAction, type CarePreferences, type CareReminder, type CareState } from './types';

export function actionState(action: CareAction, previous: CareState): CareState {
  if (action === 'done') return 'done';
  if (action === 'later') return 'postponed';
  if (action === 'help') return 'help';
  if (action === 'decline') return 'declined';
  return previous;
}
export function canPostpone(reminder: Pick<CareReminder, 'critical' | 'snooze_minutes'>, minutes: number) {
  return Number.isInteger(minutes) && minutes > 0 && minutes <= 120 && (!reminder.critical || (reminder.snooze_minutes > 0 && minutes <= reminder.snooze_minutes));
}
export function inQuietPeriod(minute: number, preferences: CarePreferences, critical = false) {
  if (critical && preferences.importantDuringQuiet) return false;
  if (!preferences.quietFrom || !preferences.quietTo || preferences.quietFrom === preferences.quietTo) return false;
  const start = toMin(preferences.quietFrom), end = toMin(preferences.quietTo);
  return start < end ? minute >= start && minute < end : minute >= start || minute < end;
}
export function quietRelease(minute: number, preferences: CarePreferences, critical = false) {
  return inQuietPeriod(minute, preferences, critical) ? toMin(preferences.quietTo) : minute;
}
export function effectiveTime(time: string, postponedMinute: number | null) { return postponedMinute === null ? time.slice(0, 5) : fmt(postponedMinute); }
export function reminderOnDate(override: string | null, date: string) { return !override || override === date; }
export function readingPreferences(input: Partial<CarePreferences>): CarePreferences {
  return { ...defaultPreferences, ...input, promptSeconds: Math.max(10, Math.min(90, input.promptSeconds ?? 30)), language: isLanguage(input.language) ? input.language : 'en', notifyMode: input.notifyMode === 'digest' ? 'digest' : 'instant' };
}
/**
 * A preparation heads-up: the minutes still left before a reminder is due, but only while
 * inside the family-approved lead window and before it has been confirmed. The interface
 * words it in the family's own language.
 */
export function prepMinutes(reminder: Pick<CareReminder, 'local_time' | 'lead_minutes' | 'state'>, minute: number): number | null {
  if (reminder.lead_minutes <= 0 || reminder.state === 'done') return null;
  const until = toMin(reminder.local_time) - minute;
  return until > 0 && until <= reminder.lead_minutes ? until : null;
}
/** Who a notice actually reached, in plain words for the family workspace. */
export function deliverySummary(detail: Record<string, string>, members: { direct_chat_id: number | null; member_name: string }[]): string {
  const entries = Object.entries(detail ?? {});
  if (!entries.length) return 'Delivery not recorded';
  const nameFor = (chatId: string) => members.find(m => String(m.direct_chat_id) === chatId)?.member_name ?? 'Shared family chat';
  const reached = entries.filter(([, outcome]) => outcome === 'accepted').map(([chatId]) => nameFor(chatId));
  const missed = entries.filter(([, outcome]) => outcome !== 'accepted').map(([chatId]) => nameFor(chatId));
  if (!missed.length) return `Reached ${reached.length} of ${entries.length}: ${reached.join(', ')}`;
  return `Reached ${reached.length} of ${entries.length}${reached.length ? `: ${reached.join(', ')}` : ''}. Not reached: ${missed.join(', ')}`;
}
export function approvedAnswer(question: string, notes: { label: string; answer: string; category: string }[]) {
  const lower = question.toLowerCase().replace(/[^a-z0-9 ]/g, '');
  const match = notes.find(n => lower.includes(n.label.toLowerCase().replace(/[^a-z0-9 ]/g, '')));
  return match ? (match.category === 'object' ? `Usually: ${match.answer}` : match.answer) : 'Your family has not added that yet. You can ask someone familiar for help.';
}
export function validatePrompt(title: string, detail: string, existingTimes: string[], time: string) {
  const warnings: string[] = [];
  if (title.length + detail.length > 160) warnings.push('This is long for a glasses prompt. Consider shorter steps.');
  if (/\b(it|later|the usual|as before)\b/i.test(title)) warnings.push('Name the item and time clearly.');
  if (existingTimes.includes(time)) warnings.push('Another reminder is at this time. Check both instructions.');
  return warnings;
}