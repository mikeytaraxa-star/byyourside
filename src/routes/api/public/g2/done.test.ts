import {describe,it,expect,vi,beforeEach} from 'vitest';
const mocks=vi.hoisted(()=>({apply:vi.fn(),device:vi.fn()}));
vi.mock('@tanstack/react-router',()=>({createFileRoute:()=> (options:unknown)=>({options})}));
vi.mock('@/lib/g2-sync.server',()=>({deviceCircle:mocks.device,json:(body:unknown,status=200)=>Response.json(body,{status}),preflight:()=>new Response(null,{status:204})}));
vi.mock('@/lib/care/service.server',()=>({applyOccurrence:mocks.apply}));
import {Route} from './done';
type Endpoint={options:{server:{handlers:{POST:(args:{request:Request})=>Promise<Response>}}}};
const post=(Route as unknown as Endpoint).options.server.handlers.POST;
beforeEach(()=>{vi.clearAllMocks();mocks.device.mockResolvedValue({supabaseAdmin:{},circleId:'family-a'});mocks.apply.mockResolvedValue({ok:true});});
const request=(data:unknown)=>new Request('https://app.example/api/public/g2/done',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
describe('legacy device completion safety',()=>{
  it('rejects a completion without its original date and durable action key',async()=>{
    const response=await post({request:request({reminderId:'11111111-1111-4111-8111-111111111111'})});
    expect(response.status).toBe(400);expect(mocks.apply).not.toHaveBeenCalled();
  });
  it('uses the same occurrence validation and idempotency as the current action endpoint',async()=>{
    const input={reminderId:'11111111-1111-4111-8111-111111111111',date:'2026-11-28',key:'22222222-2222-4222-8222-222222222222',minutes:15};
    expect((await post({request:request(input)})).status).toBe(200);
    expect(mocks.apply).toHaveBeenCalledWith({},'family-a',{...input,action:'done'},'Your Loved One');
    mocks.apply.mockRejectedValue(new Error('Earlier day'));
    expect((await post({request:request({...input,date:'2026-11-27'})})).status).toBe(400);
  });
});