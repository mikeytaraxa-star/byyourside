import {z} from 'zod';
import type {Json} from '@/integrations/supabase/types';
import {localClock,isValidTimeZone} from '@/lib/reminder-alerts';
import {toMin} from '@/components/demo/engine';
import {newPairCode,formatPairCode} from '@/lib/pairing';
import {defaultPreferences,type CareWorkspace,type CarePreferences,type CareState,type CareNote,type DeliveryOutcome} from './types';
import {preferencesSchema,requestSchema,actionSchema} from './schemas';
import {readingPreferences,effectiveTime,reminderOnDate,approvedAnswer} from './rules';
import {careHash,type CareClient,type FamilyActor} from './auth.server';
import {sendTelegramMessage} from '@/lib/g2-sync.server';
import {validateFamilyFile,familyMediaPath} from './family-moments';
export function preferences(raw:Json):CarePreferences{const parsed=preferencesSchema.safeParse({...defaultPreferences,...(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{})});return readingPreferences(parsed.success?parsed.data:defaultPreferences);}
function check(error:{message:string}|null){if(error)throw new Error('Could not save this change. Please try again.');}
export async function loadCare(client:CareClient,circleId:string,member:CareWorkspace['member']):Promise<CareWorkspace>{
  const {data:circle,error}=await client.from('care_circles').select('id,display_name,timezone,summary_time,preferences').eq('id',circleId).single();check(error);if(!circle)throw new Error('Family unavailable');
  const {date,minute}=localClock(new Date(),circle.timezone);
  const [rem,routines,notes,members,events,history,devices,occ,people]=await Promise.all([
    client.from('reminders').select('id,local_time,title,detail,critical,snooze_minutes,date_override,confirmed_on,lead_minutes').eq('circle_id',circleId).is('deleted_at',null).order('local_time').limit(100),
    client.from('care_routines').select('*').eq('circle_id',circleId).order('local_time').limit(50),
    client.from('care_notes').select('*').eq('circle_id',circleId).order('label').limit(100),
    client.from('care_members').select('id,member_name,role,direct_chat_id,notify_order,revoked_at').eq('circle_id',circleId).order('created_at').limit(50),
    client.from('care_events').select('id,reminder_id,kind,label,actor_name,created_at,acknowledged_by,delivery,delivery_detail').eq('circle_id',circleId).order('created_at',{ascending:false}).limit(100),
    client.from('care_history').select('id,entity,entity_id,label,created_at,undone_at').eq('circle_id',circleId).order('created_at',{ascending:false}).limit(50),
    client.from('g2_devices').select('id,last_seen_at,created_at').eq('circle_id',circleId).order('created_at').limit(50),
    client.from('care_occurrences').select('*').eq('circle_id',circleId).eq('local_date',date).limit(100),
    client.from('people').select('id,name,relation,note,created_at').eq('circle_id',circleId).limit(100),
  ]);
  for(const result of [rem,routines,notes,members,events,history,devices,occ,people])check(result.error);
  const legacyNotes:CareNote[]=(people.data??[]).filter(p=>!(notes.data??[]).some(n=>n.label.toLowerCase()===p.name.toLowerCase())).map(p=>({id:p.id,label:p.name,answer:`${p.name} is your ${p.relation}. ${p.note}`,category:'person',phone:'',media_path:null,media_kind:null,updated_at:p.created_at}));
  return {circle:{...circle,preferences:preferences(circle.preferences)},member,date,minute,
    reminders:(rem.data??[]).filter(r=>reminderOnDate(r.date_override,date)).map(r=>{const o=occ.data?.find(v=>v.reminder_id===r.id);return {...r,state:(r.confirmed_on===date?'done':o?.state??'pending') as CareState,effective_time:effectiveTime(r.local_time,o?.postponed_minute??null),version:o?.version??0,step:o?.step??0,lead_minutes:Number(r.lead_minutes??0)};}),
    routines:(routines.data??[]).filter(r=>reminderOnDate(r.date_override,date)).map(r=>({...r,steps:Array.isArray(r.steps)?r.steps.filter((s):s is string=>typeof s==='string'):[],progress:typeof r.progress==='object'&&r.progress&&!Array.isArray(r.progress)?Number(r.progress[date]??0):0})),
    notes:[...(notes.data??[]).map(n=>({...n,category:n.category as CareNote['category'],media_kind:n.media_kind as CareNote['media_kind']})),...legacyNotes],
    members:(members.data??[]).map(m=>({...m,role:m.role as 'owner'|'editor'|'viewer'})),events:(events.data??[]).map(e=>({...e,delivery_detail:e.delivery_detail&&typeof e.delivery_detail==='object'&&!Array.isArray(e.delivery_detail)?Object.fromEntries(Object.entries(e.delivery_detail).map(([chat,outcome])=>[chat,String(outcome)])):null})),history:history.data??[],devices:devices.data??[],
    capabilities:{cocoon:Boolean(process.env['COCOON_BASE_URL']&&process.env['COCOON_API_KEY']),speech:false,battery:false,email:Boolean(process.env['LOVABLE_API_KEY'])}};
}
export async function notifyEvent(client:CareClient,circleId:string,eventId:string,text:string,backup=false,groupable=false){
  const {data:circle}=await client.from('care_circles').select('telegram_chat_id,preferences').eq('id',circleId).single();if(!circle)return false;
  // Routine confirmations can be bundled instead of arriving one message at a time.
  if(groupable&&preferences(circle.preferences).notifyMode==='digest'){
    await client.from('care_events').update({delivery:'queued'}).eq('id',eventId).eq('circle_id',circleId).eq('delivery','not_sent');
    return true;
  }
  const {data:members}=await client.from('care_members').select('direct_chat_id').eq('circle_id',circleId).is('revoked_at',null).eq('notify_order',backup?2:1).limit(20);
  const recipients=[...new Set([circle.telegram_chat_id,...(members??[]).map(m=>m.direct_chat_id).filter((v):v is number=>v!==null)])];
  const outcomes=await Promise.all(recipients.map(id=>sendTelegramMessage(id,text).catch(()=>false)));
  const detail:Record<string,DeliveryOutcome>={};
  recipients.forEach((id,index)=>{detail[String(id)]=outcomes[index]?'accepted':'failed';});
  const reached=outcomes.filter(Boolean).length;
  const delivery=reached===recipients.length?'accepted':reached?'partial':'failed';
  await client.from('care_events').update({delivery,delivery_detail:detail as Json}).eq('id',eventId).eq('circle_id',circleId);
  return reached===recipients.length;
}
export async function applyOccurrence(client:CareClient,circleId:string,input:z.infer<typeof actionSchema>,actorName:string){
  const {data:circle}=await client.from('care_circles').select('timezone').eq('id',circleId).single();if(!circle)throw new Error('Family unavailable');
  const {date,minute}=localClock(new Date(),circle.timezone);
  // Old offline actions retain their original date; never confirm today's medication with yesterday's tap.
  if(input.date!==date)throw new Error('This action belongs to an earlier day. Please review today’s reminder.');
  const {data,error}=await client.rpc('care_apply_action',{p_circle:circleId,p_reminder:input.reminderId,p_date:date,p_action:input.action,p_key:`${circleId}:${input.key}`,p_actor:actorName,p_minute:minute,p_minutes:input.minutes});
  if(error)throw new Error(error.message.includes('Postponement')?'Your family has not approved that postponement.':'Could not record this action.');
  const result=z.object({state:z.string(),version:z.number(),eventId:z.string().optional(),duplicate:z.boolean().optional()}).parse(data);
  if(result.eventId&&!result.duplicate&&['done','help','decline','later'].includes(input.action)){
    const {data:row}=await client.from('reminders').select('title').eq('id',input.reminderId).eq('circle_id',circleId).single();
    const label=input.action==='done'?'Confirmed (not proof of medication taken)':input.action==='help'?'Asked for help':input.action==='decline'?'Not today — not confirmed':`Asked for ${input.minutes} more minutes`;
    await notifyEvent(client,circleId,result.eventId,`${label}: ${row?.title??'Reminder'}. ${input.action==='help'?'Please check in.':''}`,false,input.action!=='help');
  }
  return {ok:true,...result};
}
const entityTable={reminder:'reminders',routine:'care_routines',note:'care_notes'} as const;
export async function careOperation(actor:FamilyActor,input:z.infer<typeof requestSchema>):Promise<unknown>{
  const {client,circleId,member}=actor;
  const ownerOps=['settings','invite','member','revoke-member','revoke-device','erase','export'];
  const readOps=['load','ack','question','media-read','action','routine-step'];
  if(ownerOps.includes(input.op)&&member.role!=='owner')throw new Error('Owner permission required.');
  if(!readOps.includes(input.op)&&member.role==='viewer')throw new Error('Editor permission required.');
  if(input.op==='load')return loadCare(client,circleId,{id:member.id,role:member.role as 'owner'|'editor'|'viewer',member_name:member.member_name});
  if(input.op==='action')return applyOccurrence(client,circleId,input,member.member_name);
  if(input.op==='routine-step'){
    const {data:circle}=await client.from('care_circles').select('timezone').eq('id',circleId).single();const {date}=localClock(new Date(),circle?.timezone??'UTC');if(input.date!==date)throw new Error('Review today’s routine first.');
    const {data:progress,error}=await client.rpc('care_routine_step',{p_circle:circleId,p_routine:input.id,p_date:date,p_step:input.step,p_key:`${circleId}:${input.key}`});check(error);return {ok:true,progress};
  }
  if(input.op==='reminder'||input.op==='routine'||input.op==='note'){
    const table=entityTable[input.op];const id=input.id??crypto.randomUUID();
    const {data:before}=await client.from(table).select('*').eq('id',id).eq('circle_id',circleId).maybeSingle();if(input.id&&!before)throw new Error('Item unavailable.');
    const at=new Date().toISOString();let values;
    if(input.op==='reminder')values={id,circle_id:circleId,title:input.title,detail:input.detail||null,local_time:input.local_time,critical:input.critical,snooze_minutes:input.snooze_minutes,date_override:input.date_override,lead_minutes:input.lead_minutes,updated_at:at};
    else if(input.op==='routine')values={id,circle_id:circleId,title:input.title,local_time:input.local_time,steps:input.steps,enabled:input.enabled,date_override:input.date_override,updated_at:at};
    else {
      if(input.recap_date && input.category!=='message')throw new Error('Only an approved positive family message can appear in the day recap.');
      values={id,circle_id:circleId,label:input.label,answer:input.answer,category:input.category,phone:input.phone,recap_date:input.recap_date,updated_at:at};
    }
    const {error}=await client.rpc('care_edit_entity',{p_circle:circleId,p_entity:input.op,p_id:id,p_values:values as Json,p_label:`${before?'Updated':'Added'} ${'title' in input?input.title:input.label}`,p_delete:false});check(error);return {ok:true,id};
  }
  if(input.op==='delete'){
    check((await client.rpc('care_edit_entity',{p_circle:circleId,p_entity:input.entity,p_id:input.id,p_values:{},p_label:'Removed item',p_delete:true})).error);return {ok:true};
  }
  if(input.op==='settings'){
    if(!isValidTimeZone(input.timezone))throw new Error('Choose a valid time zone.');
    check((await client.from('care_circles').update({display_name:input.display_name,timezone:input.timezone,summary_time:input.summary_time,preferences:input.preferences}).eq('id',circleId)).error);
    if(!input.preferences.locationSharing)check((await client.from('g2_devices').update({last_lat:null,last_lng:null,last_accuracy:null,last_location_at:null}).eq('circle_id',circleId)).error);
    return {ok:true};
  }
  if(input.op==='ack'){
    check((await client.from('care_events').update({acknowledged_by:member.id}).eq('id',input.id).eq('circle_id',circleId).is('acknowledged_by',null)).error);return {ok:true};
  }
  if(input.op==='invite'){
    const code=newPairCode()+newPairCode().slice(0,5);check((await client.from('care_invitations').insert({circle_id:circleId,code_hash:await careHash(code),role:input.role,created_by:member.id,expires_at:new Date(Date.now()+30*60_000).toISOString()})).error);
    return {ok:true,code:`${formatPairCode(code.slice(0,10))}-${code.slice(10)}`,instruction:'Send /join followed by this code privately to @bysappbot. Expires in 30 minutes; use once.'};
  }
  if(input.op==='member'){
    const {data:target}=await client.from('care_members').select('direct_chat_id').eq('id',input.id).eq('circle_id',circleId).is('revoked_at',null).single();if(!target)throw new Error('Member unavailable');if(input.notify_order>0&&!target.direct_chat_id)throw new Error('This member must start the bot privately first.');
    check((await client.from('care_members').update({notify_order:input.notify_order}).eq('id',input.id).eq('circle_id',circleId)).error);return {ok:true};
  }
  if(input.op==='revoke-member'){
    if(input.id===member.id)throw new Error('You cannot remove your own owner access.');
    check((await client.from('care_members').update({revoked_at:new Date().toISOString(),notify_order:0}).eq('id',input.id).eq('circle_id',circleId)).error);return {ok:true};
  }
  if(input.op==='revoke-device'){check((await client.from('g2_devices').delete().eq('id',input.id).eq('circle_id',circleId)).error);return {ok:true};}
  if(input.op==='undo'){
    const {error}=await client.rpc('care_undo_entity',{p_circle:circleId,p_history:input.id});
    if(error)throw new Error(error.message.includes('newer change')?'A newer change exists. Undo would overwrite it.':'Change unavailable.');
    return {ok:true};
  }
  if(input.op==='question'){
    const workspace=await loadCare(client,circleId,{id:member.id,role:member.role as 'owner'|'editor'|'viewer',member_name:member.member_name});
    const hasCocoon=workspace.capabilities.cocoon;
    if(!hasCocoon)return {ok:true,mode:input.draft?'draft':'approved-notes',text:input.draft?input.question.slice(0,160):approvedAnswer(input.question,workspace.notes,workspace.circle.preferences.language),requiresApproval:input.draft};
    const {askCocoon}=await import('@/lib/cocoon.server');const context=JSON.stringify({notes:workspace.notes.map(n=>({label:n.label,answer:n.answer})),reminders:workspace.reminders.map(r=>({title:r.title,time:r.effective_time,state:r.state}))});
    const result=await askCocoon({baseUrl:process.env['COCOON_BASE_URL'],apiKey:process.env['COCOON_API_KEY'],model:process.env['COCOON_MODEL'],question:input.draft?`Draft a clearer short reminder, without adding facts or changing dosage/timing: ${input.question}`:input.question,context});
    return {ok:true,...result,requiresApproval:input.draft};
  }
  if(input.op==='test-alert'){
    const id=crypto.randomUUID();check((await client.from('care_events').insert({id,circle_id:circleId,idempotency_key:id,kind:'test',label:'Notification readiness test',actor_name:member.member_name})).error);
    const {data:circle}=await client.from('care_circles').select('telegram_chat_id').eq('id',circleId).single();
    const telegram=await notifyEvent(client,circleId,id,'ByYourSide notification test requested by your family. Please acknowledge it in the family workspace.');
    let email='not_enrolled';if(circle){const {loadFamilyEmail}=await import('@/lib/email-alerts.server');const {emailRecipient}=await import('@/lib/email-alerts');const recipient=emailRecipient((await loadFamilyEmail(client,circle.telegram_chat_id))?.state??null);if(recipient){const {sendTemplateEmail}=await import('@/lib/email-templates/send-email');try{const result=await sendTemplateEmail('readiness-test',recipient,{templateData:{requestedBy:member.member_name},idempotencyKey:`care-test-${id}`});email=result.sent?'accepted':'suppressed';}catch{email='failed';}}}
    return {ok:true,telegram:telegram?'accepted':'failed',email};
  }
  if(input.op==='export'){
    const exported:Record<string,unknown>={format:'ByYourSide care records v1',exportedAt:new Date().toISOString(),media:'Private media files are referenced, not embedded. Provider logs and access credentials are excluded.'};
    const circleResult=await client.from('care_circles').select('*').eq('id',circleId);check(circleResult.error);exported['care_circles']=circleResult.data;
    for(const table of ['reminders','care_occurrences','care_routines','care_notes','people','care_events','care_history','care_members'] as const){
      const rows:unknown[]=[];let offset=0;
      for(;;){const result=await client.from(table).select('*').eq('circle_id',circleId).order(table==='care_occurrences'?'reminder_id':'id').range(offset,offset+499);check(result.error);rows.push(...result.data??[]);if(!result.data||result.data.length<500)break;offset+=500;}
      exported[table]=rows;
    }
    return {ok:true,export:exported};
  }
  if(input.op==='erase'){
    const {eraseFamilyData}=await import('./erase.server');await eraseFamilyData(client,circleId);return {ok:true,erased:true};
  }
  if(input.op==='media-read'||input.op==='media'||input.op==='media-remove'){
    const {data:note}=await client.from('care_notes').select('id,media_path').eq('id',input.noteId).eq('circle_id',circleId).single();if(!note)throw new Error('Note unavailable');
    if(note.media_path&&!familyMediaPath(note.media_path,circleId,note.id))throw new Error('Media unavailable');
    if(input.op==='media-read'){if(!note.media_path)return {ok:true,url:null};const {data,error}=await client.storage.from('care-family-media').createSignedUrl(note.media_path,120);check(error);return {ok:true,url:data?.signedUrl??null};}
    if(input.op==='media-remove'){if(note.media_path)check((await client.storage.from('care-family-media').remove([note.media_path])).error);check((await client.from('care_notes').update({media_path:null,media_kind:null}).eq('id',note.id).eq('circle_id',circleId)).error);return {ok:true};}
    if((input.kind==='photo')!==input.mime.startsWith('image/'))throw new Error('Choose a matching photo or audio file.');
    let bytes:Uint8Array;try{bytes=Uint8Array.from(atob(input.data),c=>c.charCodeAt(0));}catch{throw new Error('Invalid media file');}validateFamilyFile(bytes.length,input.mime);
    const path=`${circleId}/${note.id}/${crypto.randomUUID()}`;const {error}=await client.storage.from('care-family-media').upload(path,bytes,{contentType:input.mime,upsert:false});check(error);
    const {data:savedRows,error:saved}=await client.from('care_notes').update({media_path:path,media_kind:input.kind}).eq('id',note.id).eq('circle_id',circleId).select('id');if(saved||!savedRows?.length){await client.storage.from('care-family-media').remove([path]);throw new Error('Could not save this media. Please refresh the family note.');}
    if(note.media_path)await client.storage.from('care-family-media').remove([note.media_path]);return {ok:true};
  }
  return {ok:false};
}
