import {createFileRoute} from '@tanstack/react-router';
import {z} from 'zod';
const input=z.union([z.object({code:z.string().max(30)}),z.object({initData:z.string().max(12000)})]);
export const Route=createFileRoute('/api/public/care/access')({server:{handlers:{POST:async({request})=>{
  const data=input.safeParse(await request.json().catch(()=>null));
  if(!data.success)return Response.json({error:'Invalid access request'},{status:400});
  const {claimCode,verifyTelegramLaunch,newSessionToken,careHash}=await import('@/lib/care/auth.server');
  if('code' in data.data){const token=await claimCode(data.data.code);return Response.json(token?{token}:{error:'Code expired or already used. Send /family to the bot.'},{status:token?200:401,headers:{'Cache-Control':'no-store'}});}
  const key=process.env['TELEGRAM_API_KEY'],lovable=process.env['LOVABLE_API_KEY'];
  if(!key||!lovable)return Response.json({error:'Telegram access unavailable'},{status:503});
  const res=await fetch('https://connector-gateway.lovable.dev/telegram/getMe',{method:'POST',headers:{Authorization:`Bearer ${lovable}`,'X-Connection-Api-Key':key,'Content-Type':'application/json'},body:'{}'});
  const bot=z.object({ok:z.literal(true),result:z.object({id:z.number()})}).safeParse(await res.json().catch(()=>null));
  if(!res.ok||!bot.success)return Response.json({error:'Telegram access unavailable'},{status:503});
  const user=await verifyTelegramLaunch(data.data.initData,String(bot.data.result.id));
  if(!user)return Response.json({error:'Open from Telegram or use a fresh /family code.'},{status:401});
  const {supabaseAdmin:client}=await import('@/integrations/supabase/client.server');
  const {data:member}=await client.from('care_members').select('id').eq('telegram_user_id',user.id).is('revoked_at',null).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(!member)return Response.json({error:'Start @bysappbot or accept a family invitation first.'},{status:403});
  const token=newSessionToken();
  const {error}=await client.from('care_sessions').insert({token_hash:await careHash(token),member_id:member.id,expires_at:new Date(Date.now()+12*60*60_000).toISOString()});
  return Response.json(error?{error:'Could not open family workspace'}:{token},{status:error?500:200,headers:{'Cache-Control':'no-store'}});
}}}});
