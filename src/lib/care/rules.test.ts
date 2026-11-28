import { describe, expect, it } from 'vitest';
import { actionState, canPostpone, inQuietPeriod, readingPreferences, reminderOnDate, approvedAnswer, prepMinutes, deliverySummary } from './rules';
import { defaultPreferences } from './types';
import { controlsFor } from '@/lib/i18n-controls';
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
  it.each([
    ['uk', 'Хто така Анна?', 'Анна'], ['ru', 'Кто такая Анна?', 'Анна'],
    ['ar', 'من هي آنا؟', 'آنا'], ['hi', 'अन्ना कौन है?', 'अन्ना'],
    ['zh', '安娜是谁？', '安娜'], ['ja', 'アンナは誰？', 'アンナ'],
    ['ko', '애나는 누구?', '애나'], ['tr', 'Anna kim?', 'Anna'],
  ])('matches family names without dropping %s script', (language, question, label) => {
    const answer = `${label}: family-approved facts`;
    expect(approvedAnswer(question ?? '', [{label:label ?? '', answer, category:'person'}],language)).toBe(answer);
  });
  it('never answers from an empty or unrelated non-Latin label', () => {
    const notes = [{label:'Анна',answer:'Private Anna facts',category:'person'},{label:'!!!',answer:'Invalid label',category:'person'}];
    expect(approvedAnswer('Кто такой Борис?',notes,'ru')).toBe(controlsFor('ru').unknownAnswer);
  });
  it('does not mistake Joanna for Anna or choose one of several matched people', () => {
    const notes = [{label:'Anna',answer:'Anna facts',category:'person'},{label:'Ben',answer:'Ben facts',category:'person'}];
    expect(approvedAnswer('Who is Joanna?',notes)).toBe(controlsFor('en').unknownAnswer);
    expect(approvedAnswer('Anna and Ben?',notes)).toBe(controlsFor('en').unknownAnswer);
  });
  it('matches composed and decomposed names without changing family facts', () => {
    expect(approvedAnswer('Qui est Jose\u0301?', [{label:'José',answer:'Approved José facts',category:'person'}], 'fr')).toBe('Approved José facts');
  });
  it('shows a heads-up only inside the approved lead window', () => {
    const base = { local_time: '08:00', lead_minutes: 10, state: 'pending' as const };
    expect(prepMinutes(base, 7 * 60 + 52)).toBe(8);
    expect(prepMinutes(base, 7 * 60 + 49)).toBeNull();
    expect(prepMinutes(base, 8 * 60)).toBeNull();
    expect(prepMinutes({ ...base, state: 'done' as const }, 7 * 60 + 52)).toBeNull();
    expect(prepMinutes({ ...base, lead_minutes: 0 }, 7 * 60 + 52)).toBeNull();
  });
  it('names who a notice reached and who it missed', () => {
    const members = [{ direct_chat_id: 111, member_name: 'Anna' }, { direct_chat_id: 222, member_name: 'Ben' }];
    expect(deliverySummary({ '111': 'accepted', '222': 'failed' }, members)).toBe('Reached 1 of 2: Anna. Not reached: Ben');
    expect(deliverySummary({ '111': 'accepted' }, members)).toBe('Reached 1 of 1: Anna');
    expect(deliverySummary({}, members)).toBe('Delivery not recorded');
  });
  it('sends routine confirmations one by one unless the family bundles them', () => {
    expect(readingPreferences({}).notifyMode).toBe('instant');
    expect(readingPreferences({ notifyMode: 'digest' }).notifyMode).toBe('digest');
    expect(readingPreferences({ notifyMode: 'nonsense' as never }).notifyMode).toBe('instant');
  });
});