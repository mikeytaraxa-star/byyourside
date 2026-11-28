import { describe, expect, it } from 'vitest';
import { alertActions, dailySummary, DIGEST_AFTER_MINUTES, digestText, GROUPABLE_KINDS, localClock, parseDone, previousDate, shouldSendSummary, type AlertReminder } from './reminder-alerts';

const r = (over: Partial<AlertReminder> = {}): AlertReminder => ({ id: 'a', local_time: '08:00:00', title: 'Blue pill', detail: null, nudged_on: null, alerted_on: null, confirmed_on: null, critical: false, missed_streak: 0, last_missed_on: null, ...over });
const T = '2026-11-23';

describe('Telegram backup alerts', () => {
  it('sends nothing before the reminder is due', () => { expect(alertActions([r()], T, 7 * 60 + 59)).toEqual([]); });
  it('nudges at the due time', () => { expect(alertActions([r()], T, 480)[0]?.kind).toBe('nudge'); });
  it('alerts the family 15 minutes after an unconfirmed reminder', () => {
    const a = alertActions([r({ nudged_on: T })], T, 495);
    expect(a[0]?.kind).toBe('alert');
    expect(a[0]?.text).toContain('Blue pill not confirmed yet');
  });
  it('does not alert at 14 minutes', () => { expect(alertActions([r({ nudged_on: T })], T, 494)).toEqual([]); });
  it('never alerts twice in one day', () => { expect(alertActions([r({ nudged_on: T, alerted_on: T })], T, 600)).toEqual([]); });
  it('stays quiet once confirmed today', () => { expect(alertActions([r({ confirmed_on: T })], T, 600)).toEqual([]); });
  it('alerts again on a new day after yesterday confirmation', () => { expect(alertActions([r({ confirmed_on: '2026-11-22', alerted_on: '2026-11-22' })], T, 600)[0]?.kind).toBe('alert'); });
  it('escalates an important reminder on its second consecutive missed day', () => {
    const a = alertActions([r({ critical: true, missed_streak: 1, last_missed_on: '2026-11-22' })], T, 495);
    expect(a[0]).toMatchObject({ kind: 'critical', missedStreak: 2 });
    expect(a[0]?.text).toContain('SECOND DAY');
  });
  it('labels a third consecutive missed day accurately', () => {
    const a = alertActions([r({ critical: true, missed_streak: 2, last_missed_on: '2026-11-22' })], T, 495);
    expect(a[0]?.text).toContain('3 DAYS IN A ROW');
  });
  it('does not treat separated missed days as consecutive', () => {
    expect(alertActions([r({ critical: true, missed_streak: 1, last_missed_on: '2026-11-20' })], T, 495)[0]?.kind).toBe('alert');
  });
  it('does not escalate an ordinary reminder on its second day', () => {
    expect(alertActions([r({ missed_streak: 1, last_missed_on: '2026-11-22' })], T, 495)[0]?.kind).toBe('alert');
  });
  it('parses /done with and without time', () => {
    expect(parseDone('/done 8:05')).toEqual({ time: '08:05' });
    expect(parseDone('/done')).toEqual({ time: null });
    expect(parseDone('/donex')).toBeNull();
  });
  it('uses the family time zone', () => { expect(localClock(new Date('2026-11-23T07:30:00Z'), 'Europe/Berlin')).toEqual({ date: '2026-11-23', minute: 8 * 60 + 30 }); });
  it('finds yesterday across a month boundary', () => { expect(previousDate('2026-12-01')).toBe('2026-11-30'); });
});

describe('daily family summary', () => {
  it('sends once at the configured local time', () => {
    expect(shouldSendSummary('21:00', null, T, 20 * 60 + 59)).toBe(false);
    expect(shouldSendSummary('21:00', null, T, 21 * 60)).toBe(true);
    expect(shouldSendSummary('21:00', T, T, 21 * 60)).toBe(false);
    expect(shouldSendSummary('off', null, T, 21 * 60)).toBe(false);
  });
  it('lists confirmed, unconfirmed and upcoming reminders', () => {
    const text = dailySummary([
      r({ id: 'done', local_time: '08:00:00', title: 'Blue pill', confirmed_on: T, critical: true }),
      r({ id: 'missed', local_time: '12:00:00', title: 'Lunch' }),
      r({ id: 'later', local_time: '22:00:00', title: 'Evening pill' }),
    ], T, 21 * 60);
    expect(text).toContain('✅ Confirmed: 1');
    expect(text).toContain('⚠️ Not confirmed: 1');
    expect(text).toContain('⏳ Still upcoming: 1');
    expect(text).toContain('✅ 08:00 ❗ Blue pill');
    expect(text).toContain('⚠️ 12:00 Lunch');
    expect(text).toContain('⏳ 22:00 Evening pill');
    expect(text).toContain('does not verify that medicine was taken');
  });
  it('bundles routine confirmations into one calm update', () => {
    const text = digestText([
      { kind: 'done', label: 'Take the blue pill', created_at: '2026-11-28T08:05:00.000Z' },
      { kind: 'later', label: 'Walk with Anna', created_at: '2026-11-28T09:12:00.000Z' },
    ], '2026-11-28');
    expect(text).toContain('ByYourSide · Family updates · 2026-11-28');
    expect(text).toContain('Confirmed · Take the blue pill');
    expect(text).toContain('A little later · Walk with Anna');
    expect(text).toContain('Important alerts still arrive immediately');
  });
  it('never bundles help or missed-reminder alerts', () => {
    expect(GROUPABLE_KINDS).not.toContain('help');
    expect(GROUPABLE_KINDS).not.toContain('alert');
    expect(GROUPABLE_KINDS).not.toContain('critical');
    expect(GROUPABLE_KINDS).toContain('done');
    expect(DIGEST_AFTER_MINUTES).toBe(10);
  });
});
