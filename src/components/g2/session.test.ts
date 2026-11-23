import { describe, expect, it } from 'vitest';
import { applyG2Gesture, restoreSession, type G2Session } from './session';
const session: G2Session = { date: '2026-11-23', selected: 0, sample: false, reminders: [
  { id: 'water', time: '14:00', text: 'Drink water', status: 'pending' },
  { id: 'walk', time: '15:00', text: 'Walk with Anna', status: 'pending' },
] };
describe('hardware schedule', () => {
  it('confirms the selected due reminder from a native tap', () => {
    expect(applyG2Gesture(session, 'tap', 14 * 60).reminders[0]?.status).toBe('done');
    expect(applyG2Gesture(session, 'tap', 14 * 60).reminders[1]?.status).toBe('pending');
  });
  it('does not confirm a future reminder', () => {
    expect(applyG2Gesture(session, 'menu-done', 13 * 60 + 59).reminders[0]?.status).toBe('pending');
  });
  it('swipes navigate with wraparound', () => {
    expect(applyG2Gesture(session, 'swipe-up', 840).selected).toBe(1);
    expect(applyG2Gesture(session, 'swipe-down', 840).selected).toBe(1);
    expect(applyG2Gesture({ ...session, selected: 1 }, 'menu-next', 840).selected).toBe(0);
  });
  it('double tap selects the earliest pending due reminder', () => {
    expect(applyG2Gesture({ ...session, selected: 1 }, 'double-tap', 16 * 60).selected).toBe(0);
  });
  it('retains completion on the same local day', () => {
    const done = applyG2Gesture(session, 'tap', 840);
    expect(restoreSession(JSON.stringify(done), '2026-11-23').reminders[0]?.status).toBe('done');
  });
  it('resets completion on a new local day without deleting reminders', () => {
    const done = applyG2Gesture(session, 'tap', 840);
    const nextDay = restoreSession(JSON.stringify(done), '2026-11-24');
    expect(nextDay.reminders[0]?.status).toBe('pending');
    expect(nextDay.reminders).toHaveLength(2);
    expect(nextDay.date).toBe('2026-11-24');
  });
  it('rejects corrupted and malformed stored reminders', () => {
    expect(restoreSession('{broken').reminders).toHaveLength(0);
    expect(restoreSession(JSON.stringify({ reminders: [{ id: 'x', time: '99:00', text: 'bad', status: 'done' }] })).reminders).toHaveLength(0);
  });
  it('limits a persisted schedule to 50 reminders', () => {
    expect(restoreSession(JSON.stringify({ ...session, reminders: Array.from({ length: 51 }, (_, i) => ({ ...session.reminders[0], id: String(i) })) })).reminders).toHaveLength(50);
  });
  it('rejects reminders over 300 characters', () => {
    expect(restoreSession(JSON.stringify({ ...session, reminders: [{ ...session.reminders[0], text: 'a'.repeat(301) }] })).reminders).toHaveLength(0);
  });
});
import { openingSelection as _open, missedReminders as _missed } from './session';
describe('catch-up on opening', () => {
  const s = { date: '2026-11-23', sample: false, selected: 2, reminders: [
    { id: 'a', time: '08:00', text: 'Blue pill', status: 'done' as const },
    { id: 'b', time: '09:00', text: 'Water', status: 'pending' as const },
    { id: 'c', time: '12:00', text: 'Lunch', status: 'pending' as const },
  ] };
  it('opens on the earliest missed reminder first', () => { expect(_open(s, 12 * 60 + 5).selected).toBe(1); });
  it('counts reminders 15+ minutes overdue as missed', () => { expect(_missed(s, 9 * 60 + 15).map(r => r.id)).toEqual(['b']); expect(_missed(s, 9 * 60 + 14)).toEqual([]); });
});
