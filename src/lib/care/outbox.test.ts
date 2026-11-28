import {describe,it,expect} from 'vitest';
import {appendAction,pendingState,restoreOutbox,type PendingAction} from './outbox';
const action:PendingAction={reminderId:'33333333-3333-4333-8333-333333333333',action:'help',key:'44444444-4444-4444-8444-444444444444',date:'2026-11-28',minutes:15};
describe('durable care actions',()=>{
  it('restores validated actions after reopening',()=>expect(restoreOutbox(JSON.stringify([action]))).toEqual([action]));
  it('rejects malformed stored actions',()=>expect(restoreOutbox('[{"action":"done"}]')).toEqual([]));
  it('does not enqueue the same action twice',()=>expect(appendAction([action],action)).toHaveLength(1));
  it('preserves help without claiming completion',()=>expect(pendingState([{id:action.reminderId,status:'pending' as const,time:'08:00'}],[action],'2026-11-28')[0]).toMatchObject({careState:'help',status:'pending'}));
  it('does not apply yesterday’s confirmation to today',()=>expect(pendingState([{id:action.reminderId,status:'pending' as const,time:'08:00'}],[{...action,action:'done'}],'2026-11-29')[0]?.status).toBe('pending'));
});
