import { newPairCode, formatPairCode, normalizePairCode } from '@/lib/pairing';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
export type CareClient = SupabaseClient<Database>;
export async function careHash(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`care:${value}`));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function newSessionToken() { return [...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join(''); }
export async function resolveFamily(request: Request) {
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i,'');
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const { supabaseAdmin: client } = await import('@/integrations/supabase/client.server');
  const {data:session} = await client.from('care_sessions').select('member_id').eq('token_hash',await careHash(token)).gt('expires_at',new Date().toISOString()).maybeSingle();
  if (!session) return null;
  const {data:member}=await client.from('care_members').select('*').eq('id',session.member_id).is('revoked_at',null).maybeSingle();
  return member ? {client,member,circleId:member.circle_id} : null;
}
export type FamilyActor = NonNullable<Awaited<ReturnType<typeof resolveFamily>>>;
export async function issueCode(client: CareClient, memberId: string) {
  const code=newPairCode()+newPairCode().slice(0,5);
  const {error}=await client.from('care_access_codes').insert({code_hash:await careHash(code),member_id:memberId,expires_at:new Date(Date.now()+10*60_000).toISOString()});
  if(error) throw new Error('Could not create access');
  return `${formatPairCode(code.slice(0,10))}-${code.slice(10)}`;
}
export async function claimCode(code: string) {
  const normalized=normalizePairCode(code);
  if(!/^[A-Z2-9]{15}$/.test(normalized)) return null;
  const {supabaseAdmin:client}=await import('@/integrations/supabase/client.server');
  const token=newSessionToken();
  const {data,error}=await client.rpc('care_claim_access',{p_hash:await careHash(normalized),p_token_hash:await careHash(token)});
  return !error && data ? token : null;
}
// Telegram's production public verification key is public, not a bot token.
const TELEGRAM_PUBLIC_KEY='e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c8fb3c7295fb2b9f1a';
export async function verifyTelegramLaunch(initData:string,botId:string,now=Date.now(),publicKey=TELEGRAM_PUBLIC_KEY) {
  try {
    const params=new URLSearchParams(initData);
    if([...params.keys()].some((key,i,all)=>all.indexOf(key)!==i)) return null;
    const at=Number(params.get('auth_date'))*1000;
    if(!Number.isFinite(at)||now-at>5*60_000||at-now>30_000) return null;
    const sig=params.get('signature'); if(!sig)return null;
    const check=[...params.entries()].filter(([k])=>k!=='hash'&&k!=='signature').sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>`${k}=${v}`).join('\n');
    const key=await crypto.subtle.importKey('raw',Uint8Array.from(publicKey.match(/.{2}/g)??[],b=>parseInt(b,16)),{name:'Ed25519'},false,['verify']);
    const raw=atob(sig.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(sig.length/4)*4,'='));
    if(!await crypto.subtle.verify({name:'Ed25519'},key,Uint8Array.from(raw,c=>c.charCodeAt(0)),new TextEncoder().encode(`${botId}:WebAppData\n${check}`)))return null;
    const user=JSON.parse(params.get('user')??'null') as {id?:unknown;first_name?:unknown}|null;
    return user&&typeof user.id==='number'&&Number.isSafeInteger(user.id)?{id:user.id,name:typeof user.first_name==='string'?user.first_name.slice(0,80):'Family member'}:null;
  } catch {return null;}
}
