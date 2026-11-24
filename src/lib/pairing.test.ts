import { describe, expect, it } from 'vitest';
import { formatPairCode, hashToken, isPairCode, normalizePairCode, isPairCommand, newPairCode, pairCodeExpired, syncOrigin } from './pairing';

describe('glasses pairing', () => {
  it('codes are 10 hard-to-guess characters', () => {
    const code = newPairCode();
    expect(code).toHaveLength(10);
    expect(isPairCode(code)).toBe(true);
    expect(isPairCode('123456')).toBe(false);
    expect(newPairCode()).not.toBe(code);
  });
  it('accepts codes typed with a dash or in lowercase', () => {
    expect(formatPairCode('ABCDEFGHJK')).toBe('ABCDE-FGHJK');
    expect(normalizePairCode('abcde-fghjk')).toBe('ABCDEFGHJK');
    expect(isPairCode('abcde-fghjk')).toBe(true);
  });
  it('recognises /pair', () => { expect(isPairCommand('/pair')).toBe(true); expect(isPairCommand('/pairs')).toBe(false); });
  it('codes expire after their time', () => {
    expect(pairCodeExpired('2026-01-01T10:15:00Z', new Date('2026-01-01T10:15:00Z'))).toBe(true);
    expect(pairCodeExpired('2026-01-01T10:15:00Z', new Date('2026-01-01T10:14:00Z'))).toBe(false);
  });
  it('installed package syncs with the published site', () => {
    expect(syncOrigin({ protocol: 'file:', origin: 'null' })).toBe('https://byside.here');
    expect(syncOrigin({ protocol: 'https:', origin: 'https://x.app' })).toBe('https://x.app');
  });
  it('hashes tokens stably', async () => { expect(await hashToken('a')).toBe(await hashToken('a')); expect(await hashToken('a')).not.toBe(await hashToken('b')); });
});
