import { describe, expect, it } from 'vitest';
import { hashToken, isPairCode, isPairCommand, newPairCode, pairCodeExpired, syncOrigin } from './pairing';

describe('glasses pairing', () => {
  it('codes are exactly 6 digits', () => {
    expect(newPairCode(() => 42)).toBe('000042');
    expect(isPairCode('123456')).toBe(true);
    expect(isPairCode('12345')).toBe(false);
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
