import { afterEach, describe, expect, it, vi } from 'vitest';
import { telegramCareCommand } from './telegram.server';
import { careHash, type CareClient } from './auth.server';

vi.mock('./service.server', () => ({ applyOccurrence: vi.fn() }));
afterEach(() => { vi.useRealTimers(); });

function fixture(memberId: string | null = 'invited-member') {
  const insert = vi.fn(async (_values: unknown) => ({ error: null }));
  const rpc = vi.fn(async (_name: string, _args: unknown) => ({ data: memberId, error: null }));
  const from = vi.fn((_table: string) => ({ insert }));
  return { client: { rpc, from } as unknown as CareClient, rpc, insert, from };
}

describe('Telegram family invitation commands', () => {
  it('claims an invitation for the actual sender and issues only a hashed private access code', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-28T02:00:00Z'));
    const f=fixture();
    const reply=await telegramCareCommand(f.client,'original-circle',42,42,'/join ABCDE-FGHJK-LMNPQ','Anna');
    expect(f.rpc).toHaveBeenCalledWith('care_claim_invitation',{
      p_hash:await careHash('ABCDEFGHJKLMNPQ'),p_user:42,p_name:'Anna',p_chat:42,
    });
    expect(f.from).toHaveBeenCalledWith('care_access_codes');
    const code=reply?.match(/\b[A-Z2-9]{5}-[A-Z2-9]{5}-[A-Z2-9]{5}\b/)?.[0];
    if(!code)throw new Error('No private access code was issued');
    expect(f.insert).toHaveBeenCalledWith({
      code_hash:await careHash(code.replaceAll('-','')),
      member_id:'invited-member',expires_at:'2026-11-28T02:10:00.000Z',
    });
    expect(JSON.stringify(f.insert.mock.calls)).not.toContain(code.replaceAll('-',''));
  });
  it('never claims an invitation posted in a group',async()=>{
    const f=fixture();
    await telegramCareCommand(f.client,'circle',42,-100,'/join ABCDE-FGHJK-LMNPQ','Anna');
    expect(f.rpc).not.toHaveBeenCalled();
    expect(f.insert).not.toHaveBeenCalled();
  });
  it('does not issue access after an expired, consumed or rejected invitation',async()=>{
    const f=fixture(null);
    await telegramCareCommand(f.client,'circle',42,42,'/join ABCDE-FGHJK-LMNPQ','Anna');
    expect(f.rpc).toHaveBeenCalledTimes(1);
    expect(f.insert).not.toHaveBeenCalled();
  });
  it('requires a Telegram sender instead of trusting a chat identifier',async()=>{
    const f=fixture();
    await telegramCareCommand(f.client,'circle',undefined,42,'/join ABCDE-FGHJK-LMNPQ');
    expect(f.rpc).not.toHaveBeenCalled();
  });
  it('rejects malformed invitation codes before any claim',async()=>{
    const f=fixture();
    await telegramCareCommand(f.client,'circle',42,42,'/join SHORT');
    expect(f.rpc).not.toHaveBeenCalled();
  });
});