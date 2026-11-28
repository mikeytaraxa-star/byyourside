import {issueCode,careHash,type CareClient} from './auth.server';
import {normalizePairCode} from '@/lib/pairing';
import {localClock} from '@/lib/reminder-alerts';
import {applyOccurrence} from './service.server';
export async function telegramCareCommand(client:CareClient,circleId:string,userId:number|undefined,chatId:number,text:string,name='Family member'):Promise<string|null>{
  if(!userId)return 'Send this command from your own Telegram account.';
  if(/^\/join(?:@\w+)?\s+/i.test(text)){
    if(chatId<0)return 'Send /join privately to @bysappbot, not in a group.';
    const code=normalizePairCode(text.replace(/^\/join(?:@\w+)?\s+/i,''));if(code.length!==15)return 'Check your invitation code.';
    const {data,error}=await client.rpc('care_claim_invitation',{p_hash:await careHash(code),p_user:userId,p_name:name,p_chat:chatId});
    if(error||!data)return 'That invitation expired or was already used.';
    const access=await issueCode(client,data);return `Family invitation accepted. Open https://byside.here/family and enter ${access}.\nThis access code works once for 10 minutes. Never share it.`;
  }
  if(/^\/family(?:@\w+)?$/i.test(text)){
    let query=client.from('care_members').select('id').eq('telegram_user_id',userId).is('revoked_at',null);
    query=chatId<0?query.eq('circle_id',circleId):query.order('created_at',{ascending:false});
    const {data:member}=await query.limit(1).maybeSingle();if(!member)return 'Ask your family owner for an invitation.';
    const access=await issueCode(client,member.id);
    const reply=`Open your family workspace: https://byside.here/family\n\nAccess code: ${access}\nWorks once for 10 minutes. Do not share it. ByYourSide will never ask you to send us this code.`;
    if(chatId<0){const {sendTelegramMessage}=await import('@/lib/g2-sync.server');return await sendTelegramMessage(userId,reply)?'Your private workspace code was sent to your own Telegram chat.':'Start @bysappbot privately first, then send /family again.';}
    return reply;
  }
  const action=text.match(/^\/(later|needhelp|nottoday|again)(?:@\w+)?\s+(\d{2}:\d{2})(?:\s+(\d{1,3}))?$/i);
  if(action){
    const {data:circle}=await client.from('care_circles').select('timezone').eq('id',circleId).single();const {date}=localClock(new Date(),circle?.timezone??'UTC');
    const {data:r}=await client.from('reminders').select('id').eq('circle_id',circleId).eq('local_time',action[2]??'').is('deleted_at',null).limit(1).maybeSingle();if(!r)return 'No reminder found at that time.';
    const map={later:'later',needhelp:'help',nottoday:'decline',again:'repeat'} as const;const key=action[1]?.toLowerCase() as keyof typeof map;
    try{await applyOccurrence(client,circleId,{reminderId:r.id,action:map[key],key:crypto.randomUUID(),date,minutes:Number(action[3]??15)},name);return 'Your choice has been recorded. Open /family to see the updated day.';}catch(error){return error instanceof Error?error.message:'Could not record that choice.';}
  }
  return null;
}
