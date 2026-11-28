import { describe, expect, it } from 'vitest';
import { actionState, canPostpone, inQuietPeriod, readingPreferences, reminderOnDate, approvedAnswer } from './rules';
import { defaultPreferences } from './types';
describe('everyday care rules', () => {
  it('help is not completion', () => expect(actionState('help', 'pending')).toBe('help'));
  it('declining is not completion', () => expect(actionState('decline', 'pending')).toBe('declined'));
  it('repeat preserves current state', () => expect(actionState('repeat', 'postponed')).toBe('postponed'));
  it('important postponement requires family permission', () => expect(canPostpone({ critical: true, snooze_minutes: 0 }, 15)).toBe(false));
  it('important postponement cannot exceed the approved limit', () => expect(canPostpone({ critical: true, snooze_minutes: 15 }, 30)).toBe(false));
  it('ordinary reminders can be explicitly postponed', () => expect(canPostpone({ critical: false, snooze_minutes: 0 }, 15)).toBe(true));
  it('important quiet-period exceptions are explicit', () => expect(inQuietPeriod(1300, { ...defaultPreferences, quietFrom: '21:00', quietTo: '07:00' }, true)).toBe(false));
  it('ordinary prompts respect overnight quiet', () => expect(inQuietPeriod(1300, { ...defaultPreferences, quietFrom: '21:00', quietTo: '07:00' })).toBe(true));
  it('dated changes do not apply tomorrow', () => expect(reminderOnDate('2026-11-28', '2026-11-29')).toBe(false));
  it('reading duration stays within 10 to 90 seconds', () => expect(readingPreferences({ promptSeconds: 999 }).promptSeconds).toBe(90));
  it('object answers describe usual rather than actual locations', () => expect(approvedAnswer('Where are my keys?', [{ label: 'keys', answer: 'The bowl by the door.', category: 'object' }])).toBe('Usually: The bowl by the door.'));
});