import { describe, expect, it } from 'vitest';
import { dayMoments, validateFamilyFile, familyMime, RECORDING_SECONDS } from './family-moments';
import type { CareNote } from './types';
const note = (id: string, patch: Partial<CareNote> = {}): CareNote => ({ id, label: id, answer: 'A family-approved moment.', category: 'message', phone: '', media_path: null, media_kind: null, updated_at: '2026-11-28T10:00:00Z', recap_date: '2026-11-28', ...patch });
describe('gentle family recap', () => {
  it('shows only explicitly approved positive messages for the local day', () => {
    expect(dayMoments([note('today'), note('unapproved', { recap_date: null }), note('yesterday', { recap_date: '2026-11-27' }), note('person', { category: 'person' }), note('voice', { media_kind: 'audio' }), note('photo', { media_kind: 'photo', media_path: 'private/photo' })], '2026-11-28').map(n => n.id)).toEqual(['today', 'photo']);
  });
  it('keeps the recap to a few moments without changing family words', () => {
    const notes = Array.from({ length: 8 }, (_, i) => note(String(i)));
    expect(dayMoments(notes, '2026-11-28')).toHaveLength(5);
    expect(dayMoments(notes, '2026-11-28')[0]?.answer).toBe('A family-approved moment.');
  });
  it('supports phone recording formats without exceeding the private file limit', () => {
    expect(RECORDING_SECONDS).toBe(60);
    expect(familyMime('audio/webm;codecs=opus')).toBe('audio/webm');
    expect(() => validateFamilyFile(5 * 1024 * 1024, 'audio/webm')).not.toThrow();
    expect(() => validateFamilyFile(5 * 1024 * 1024 + 1, 'audio/webm')).toThrow();
    expect(() => validateFamilyFile(0, 'audio/webm')).toThrow();
    expect(() => validateFamilyFile(200, 'text/html')).toThrow();
  });
});