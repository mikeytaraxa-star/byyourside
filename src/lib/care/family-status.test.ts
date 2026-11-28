import { describe, expect, it } from 'vitest';
import { familyStatus, isConfirmedAction } from './family-status';
import { sampleWorkspace } from './sample';
import type { CareEvent } from './types';

const event = (kind: string, created_at = '2026-11-28T08:00:00Z'): CareEvent => ({
  id: kind + created_at, kind, created_at, reminder_id: 'reminder', label: 'Family reminder',
  actor_name: 'Your Loved One', acknowledged_by: null, delivery: 'not_sent',
});
function workspace() { return { ...sampleWorkspace(), date: '2026-11-28' }; }

describe('family status evidence', () => {
  it('counts recorded confirmations independently from optimistic medication state', () => {
    const data = workspace();
    const reminder = data.reminders[0];
    if (!reminder) throw new Error('Missing fixture');
    reminder.state = 'done';
    expect(familyStatus(data).reminderConfirmations).toBe(0);
    data.events = [event('done')];
    expect(familyStatus(data).reminderConfirmations).toBe(1);
    expect(familyStatus(data)).not.toHaveProperty('medicationTaken');
  });
  it.each(['help', 'decline', 'later', 'repeat', 'ack'])('%s is not a confirmed action', kind => {
    expect(isConfirmedAction(event(kind))).toBe(false);
  });
  it('keeps routine step confirmations separate from reminder confirmations', () => {
    const data = workspace(); data.events = [event('routine-step'), event('done')];
    expect(familyStatus(data).routineConfirmations).toBe(1);
    expect(familyStatus(data).reminderConfirmations).toBe(1);
  });
  it('uses the family calendar day, not the browser day or UTC day', () => {
    const data = workspace(); data.circle.timezone = 'America/Los_Angeles';
    data.events = [event('done', '2026-11-29T01:00:00Z'), event('done', '2026-11-28T01:00:00Z')];
    expect(familyStatus(data).events.map(e => e.created_at)).toEqual(['2026-11-29T01:00:00Z']);
  });
  it('finds the latest valid sync across all devices, regardless of creation order', () => {
    const data = workspace(); data.devices = [
      { id: 'old', created_at: '', last_seen_at: '2026-11-28T08:00:00Z' },
      { id: 'new', created_at: '', last_seen_at: '2026-11-28T09:00:00Z' },
      { id: 'unknown', created_at: '', last_seen_at: 'invalid' },
    ];
    expect(familyStatus(data).lastDeviceSync).toBe('2026-11-28T09:00:00Z');
    expect(familyStatus(data).devices[0]?.id).toBe('new');
  });
  it('does not invent a sync for an unpaired or never-synced device', () => {
    const data = workspace(); expect(familyStatus(data).lastDeviceSync).toBeNull();
    data.devices = [{ id: 'device', created_at: '', last_seen_at: null }];
    expect(familyStatus(data).lastDeviceSync).toBeNull();
  });
  it('does not treat a family check-in acknowledgement as reminder completion', () => {
    const data = workspace(); data.events = [{ ...event('help'), acknowledged_by: 'relative' }];
    expect(familyStatus(data).unansweredHelp).toBe(0);
    expect(familyStatus(data).reminderConfirmations).toBe(0);
  });
});