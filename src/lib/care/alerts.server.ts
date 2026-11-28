import type {CareClient} from './auth.server';
import type {Json} from '@/integrations/supabase/types';
import {preferences,notifyEvent} from './service.server';
import {localClock,DIGEST_AFTER_MINUTES,GROUPABLE_KINDS,digestText} from '@/lib/reminder-alerts';
import {toMin} from '@/components/demo/engine';
import {sendTelegramMessage} from '@/lib/g2-sync.server';
export async function recordScheduledEvent(client:CareClient,circleId:string,reminderId:string,date:string,kind:string,label:string,accepted:boolean){
  const key=`scheduled:${circleId}:${reminderId}:${date}:${kind}`;
  const {data}=await client.from('care_events').upsert({circle_id:circleId,reminder_id:reminderId,idempotency_key:key,kind,label,delivery:accepted?'accepted':'failed'},{onConflict:'idempotency_key',ignoreDuplicates:true}).select('id');
  const eventId=data?.[0]?.id;if(eventId){const {data:recipients}=await client.from('care_members').select('direct_chat_id').eq('circle_id',circleId).is('revoked_at',null).eq('notify_order',1).limit(20);const {sendTelegramMessage}=await import('@/lib/g2-sync.server');await Promise.all((recipients??[]).filter(m=>m.direct_chat_id!==null).map(m=>m.direct_chat_id?sendTelegramMessage(m.direct_chat_id,label).catch(()=>false):Promise.resolve(false)));}
}
export async function runCareAvailability(client:CareClient,circleId:string){
  const {data:circle}=await client.from('care_circles').select('preferences,timezone').eq('id',circleId).single();if(!circle)return;
  const pref=preferences(circle.preferences),now=new Date(),{date,minute}=localClock(now,circle.timezone);
  if(pref.morningCheck&&minute>=toMin(pref.morningCheck)&&(!pref.breakUntil||Date.parse(pref.breakUntil)<=now.getTime())){
    const {data:devices}=await client.from('g2_devices').select('last_seen_at').eq('circle_id',circleId).limit(50);
    const connectedToday=(devices??[]).some(d=>d.last_seen_at&&localClock(new Date(d.last_seen_at),circle.timezone).date===date);
    if(!connectedToday){const key=`availability:${circleId}:${date}`;const {data:claimed}=await client.from('care_events').upsert({circle_id:circleId,idempotency_key:key,kind:'availability',label:'ByYourSide has not connected this morning. This is a connection notice, not proof that glasses are unworn.'},{onConflict:'idempotency_key',ignoreDuplicates:true}).select('id');const e=claimed?.[0];if(e)await notifyEvent(client,circleId,e.id,'ByYourSide has not connected this morning. Please check whether the companion is open. This does not detect glasses being worn.');}
  }
  const {data:open}=await client.from('care_events').select('id,label,created_at,reminder_id').eq('circle_id',circleId).is('acknowledged_by',null).is('escalated_at',null).in('kind',['help','alert','critical']).lt('created_at',new Date(now.getTime()-pref.escalationMinutes*60_000).toISOString()).limit(100);
  for(const event of open??[]){const {data:r}=event.reminder_id?await client.from('reminders').select('confirmed_on').eq('id',event.reminder_id).eq('circle_id',circleId).maybeSingle():{data:null};if(r?.confirmed_on===date)continue;
    const {data:claimed}=await client.from('care_events').update({escalated_at:now.toISOString()}).eq('id',event.id).is('escalated_at',null).is('acknowledged_by',null).select('id');if(claimed?.length)await notifyEvent(client,circleId,event.id,`Family follow-up: ${event.label}. No family acknowledgement has been recorded. Please coordinate a direct check-in.`,true);
  }
}
/** Bundles routine confirmations into one family message when the family chose that mode. */
export async function runCareDigest(client:CareClient,circleId:string){
  const {data:circle}=await client.from('care_circles').select('telegram_chat_id,preferences,timezone').eq('id',circleId).single();if(!circle)return;
  if(preferences(circle.preferences).notifyMode!=='digest')return;
  const cutoff=new Date(Date.now()-DIGEST_AFTER_MINUTES*60_000).toISOString();
  const {data:queued}=await client.from('care_events').select('id,kind,label,created_at').eq('circle_id',circleId).eq('delivery','queued').is('grouped_at',null).lt('created_at',cutoff).in('kind',[...GROUPABLE_KINDS]).order('created_at').limit(20);
  if(!queued?.length)return;
  const {date}=localClock(new Date(),circle.timezone);
  const text=digestText(queued,date);
  const {data:members}=await client.from('care_members').select('direct_chat_id').eq('circle_id',circleId).is('revoked_at',null).eq('notify_order',1).limit(20);
  const recipients=[...new Set([circle.telegram_chat_id,...(members??[]).map(m=>m.direct_chat_id).filter((v):v is number=>v!==null)])];
  const outcomes=await Promise.all(recipients.map(id=>sendTelegramMessage(id,text).catch(()=>false)));
  const detail:Record<string,string>={};
  recipients.forEach((id,index)=>{detail[String(id)]=outcomes[index]?'accepted':'failed';});
  const reached=outcomes.filter(Boolean).length;
  const delivery=reached===recipients.length?'accepted':reached?'partial':'failed';
  const groupedAt=new Date().toISOString();
  for(const event of queued)await client.from('care_events').update({delivery,delivery_detail:detail as Json,grouped_at:groupedAt}).eq('id',event.id).eq('circle_id',circleId);
}
