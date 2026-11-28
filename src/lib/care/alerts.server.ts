import type {CareClient} from './auth.server';
import {preferences,notifyEvent} from './service.server';
import {localClock} from '@/lib/reminder-alerts';
import {toMin} from '@/components/demo/engine';
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
