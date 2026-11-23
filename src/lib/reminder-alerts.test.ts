import { describe, expect, it } from 'vitest';
import { alertActions, localClock, parseDone, type AlertReminder } from './reminder-alerts';

const r = (over: Partial<AlertReminder> = {}): AlertReminder => ({ id: 'a', local_time: '08:00:00', title: 'Blue pill', detail: null, nudged_on: null, alerted_on: null, confirmed_on: null, ...over });
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
  it('parses /done with and without time', () => {
    expect(parseDone('/done 8:05')).toEqual({ time: '08:05' });
    expect(parseDone('/done')).toEqual({ time: null });
    expect(parseDone('/donex')).toBeNull();
  });
  it('uses the family time zone', () => { expect(localClock(new Date('2026-11-23T07:30:00Z'), 'Europe/Berlin')).toEqual({ date: '2026-11-23', minute: 8 * 60 + 30 }); });
});
