import {Component,Suspense,createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {queryOptions,useSuspenseQuery,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {sampleWorkspace} from '@/lib/care/sample';
import {actionState,approvedAnswer,effectiveTime} from '@/lib/care/rules';
import type {CareWorkspace,CareAction,CareState} from '@/lib/care/types';
const CACHE_KEY='byyourside.family.cache';const QUEUE_KEY='byyourside.family.outbox';const TOKEN_KEY='byyourside.family.session';const DEMO_KEY='byyourside.family.showcase';
export async function callCare(token:string,body:unknown){const response=await fetch('/api/public/care/workspace',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(typeof data.error==='string'?data.error:'Could not save your change');return data;}
const Context=createContext<{data:CareWorkspace;demo:boolean;busy:boolean;notice:string;operate:(body:Record<string,unknown>)=>Promise<Record<string,unknown>>;logout:()=>void}|null>(null);
export function useFamily(){const ctx=useContext(Context);if(!ctx)throw new Error('Family workspace unavailable');return ctx;}
class AccessBoundary extends Component<{children:ReactNode;reset:()=>void},{error:boolean}>{override state={error:false};static getDerivedStateFromError(){return {error:true};}override render(){return this.state.error?<div className="py-12"><h2 className="text-xl font-semibold">Your family workspace could not open.</h2><p className="mt-2 text-muted-foreground">Use a fresh /family code or try again when you are online.</p><Button className="mt-4" onClick={this.props.reset}>Return to sign in</Button></div>:this.props.children;}}
export function FamilyProvider({children}:{children:ReactNode}){
  const [token,setToken]=useState('');const [demo,setDemo]=useState(false);const [ready,setReady]=useState(false);const [code,setCode]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
  useEffect(()=>{try{setToken(localStorage.getItem(TOKEN_KEY)??'');}catch{}setReady(true);const tg=(window as Window&{Telegram?:{WebApp?:{initData?:string;ready?:()=>void}}}).Telegram?.WebApp;tg?.ready?.();if(tg?.initData){setBusy(true);fetch('/api/public/care/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData:tg.initData})}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);setToken(d.token);try{localStorage.setItem(TOKEN_KEY,d.token);}catch{}}).catch(e=>setNotice(e instanceof Error?e.message:'Open with a fresh code.')).finally(()=>setBusy(false));}},[]);
  const logout=()=>{try{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(CACHE_KEY);localStorage.removeItem(QUEUE_KEY);}catch{}setToken('');setDemo(false);setNotice('');};
  if(!ready)return <p className="py-12 text-muted-foreground">Opening ByYourSide…</p>;
  if(demo)return <DemoSession logout={logout}>{children}</DemoSession>;
  if(token)return <AccessBoundary key={token} reset={logout}><Suspense fallback={<p className="py-12 text-muted-foreground">Opening your family’s day…</p>}><LiveSession token={token} logout={logout}>{children}</LiveSession></Suspense></AccessBoundary>;
  return <section className="mx-auto max-w-lg py-12"><img src="/favicon.svg" alt="" className="mb-5 h-16 w-16"/><h1 className="text-3xl font-semibold">A little less to remember.</h1><p className="mt-3 leading-relaxed text-muted-foreground">Send <strong className="text-foreground">/family</strong> privately to <a href="https://t.me/bysappbot" className="text-primary">@bysappbot</a>, then enter your one-time access code.</p><form className="mt-7 space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);setNotice('');try{const response=await fetch('/api/public/care/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const d=await response.json();if(!response.ok)throw new Error(d.error);setToken(d.token);setCode('');try{localStorage.setItem(TOKEN_KEY,d.token);}catch{}}catch(error){setNotice(error instanceof Error?error.message:'Could not open your workspace.');}finally{setBusy(false);}}}><label className="block text-sm">Private access code<Input className="mt-2" autoComplete="off" aria-label="Private access code" value={code} onChange={e=>setCode(e.target.value)} maxLength={30} required/></label><Button disabled={busy} type="submit">{busy?'Opening…':'Open my family workspace'}</Button></form>{notice&&<p role="status" className="mt-4 text-sm text-primary">{notice}</p>}<div className="mt-9 border-t border-border pt-6"><Button variant="outline" onClick={()=>setDemo(true)}>Explore a fictional family</Button><p className="mt-3 text-xs text-muted-foreground">Sample care information only. No Telegram messages or emails are sent.</p></div></section>;
}
function LiveSession({token,logout,children}:{token:string;logout:()=>void;children:ReactNode}){
  const qc=useQueryClient();const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const [offline,setOffline]=useState(false);
  const readQueue=():Record<string,unknown>[]=>{try{const saved=JSON.parse(localStorage.getItem(QUEUE_KEY)??'null') as {token?:string;items?:Record<string,unknown>[]}|null;return saved?.token===token&&Array.isArray(saved.items)?saved.items:[];}catch{return [];}};
  const saveQueue=(items:Record<string,unknown>[])=>localStorage.setItem(QUEUE_KEY,JSON.stringify({token,items}));
  const query=queryOptions({queryKey:['care-workspace',token],queryFn:async()=>{
    if(navigator.onLine){for(const item of readQueue()){try{await callCare(token,item);saveQueue(readQueue().filter(v=>v['key']!==item['key']));}catch(e){if(e instanceof Error&&/earlier day|expired|permission/.test(e.message)){saveQueue(readQueue().filter(v=>v['key']!==item['key']));setNotice(e.message);}else throw e;}}}
    try{const fresh=await callCare(token,{op:'load'}) as CareWorkspace;setOffline(false);let expiresAt=Date.now()+12*60*60_000;try{const old=JSON.parse(localStorage.getItem(CACHE_KEY)??'null');if(old?.token===token)expiresAt=old.expiresAt;localStorage.setItem(CACHE_KEY,JSON.stringify({token,expiresAt,data:fresh}));}catch{}return fresh;}
    catch(error){if(error instanceof TypeError||!navigator.onLine){try{const cached=JSON.parse(localStorage.getItem(CACHE_KEY)??'null') as {token?:string;expiresAt:number;data:CareWorkspace}|null;if(cached?.token===token&&cached.expiresAt>Date.now()){setOffline(true);const next=structuredClone(cached.data);for(const item of readQueue()){const r=next.reminders.find(r=>r.id===item['reminderId']);if(r&&item['date']===next.date)r.state=actionState(item['action'] as CareAction,r.state);}return next;}}catch{}}throw error;}
  },staleTime:15_000,refetchInterval:60_000});const {data}=useSuspenseQuery(query);
  useEffect(()=>{const reconnect=()=>void qc.invalidateQueries({queryKey:query.queryKey});window.addEventListener('online',reconnect);return()=>window.removeEventListener('online',reconnect);},[token,qc]);
  const operate=async(body:Record<string,unknown>)=>{setBusy(true);setNotice('');try{
    if(!navigator.onLine&&(body['op']==='action'||body['op']==='routine-step')){const queue=readQueue();if(queue.length>=100)throw new Error('Reconnect before saving more choices.');saveQueue([...queue,body]);qc.setQueryData(query.queryKey,(old:CareWorkspace|undefined)=>{if(!old)return old;const next=structuredClone(old);if(body['op']==='action'){const r=next.reminders.find(r=>r.id===body['reminderId']);if(r)r.state=actionState(body['action'] as CareAction,r.state);}else{const r=next.routines.find(r=>r.id===body['id']);if(r)r.progress=Number(body['step']);}return next;});setOffline(true);setNotice('Saved offline. Your choice will send when connected.');return {ok:true,pending:true};}
    if(!navigator.onLine&&body['op']==='question')return {ok:true,text:approvedAnswer(String(body['question']),data.notes),mode:'Saved approved family notes'};
    const d=await callCare(token,body);if(body['op']!=='media-read'&&body['op']!=='question'&&body['op']!=='export')await qc.invalidateQueries({queryKey:query.queryKey});setNotice(d.erased?'Family care data removed.':'');if(d.erased)logout();return d;
  }catch(e){const text=e instanceof Error?e.message:'Could not save';setNotice(text);throw e;}finally{setBusy(false);}};
  return <Context.Provider value={{data,demo:false,busy,notice:offline?`Offline · showing saved care information · ${readQueue().length} choices waiting. ${notice}`:notice,operate,logout}}>{children}</Context.Provider>;
}
function DemoSession({logout,children}:{logout:()=>void;children:ReactNode}){
  const [data,setData]=useState<CareWorkspace>(()=>sampleWorkspace());const [notice,setNotice]=useState('');
  useEffect(()=>{try{const raw=localStorage.getItem(DEMO_KEY);if(raw){const saved=JSON.parse(raw) as CareWorkspace;if(saved.circle?.id===data.circle.id)setData(saved);}}catch{}},[]);
  const operate=async(body:Record<string,unknown>):Promise<Record<string,unknown>>=>{
    const op=body['op'];setNotice('');let next=structuredClone(data);let result:Record<string,unknown>={ok:true};
    if(op==='action'){
      const r=next.reminders.find(r=>r.id===body['reminderId']);if(!r)throw new Error('Reminder unavailable');
      const action=body['action'] as CareAction;if(action==='later'&&r.critical&&r.snooze_minutes<Number(body['minutes']??15)){setNotice('Your family has not approved that postponement.');throw new Error('Postponement not approved');}
      r.state=actionState(action,r.state);r.version++;if(action==='later')r.effective_time=effectiveTime(r.local_time,next.minute+Number(body['minutes']??15));
      next.events.unshift({id:crypto.randomUUID(),reminder_id:r.id,kind:action,label:r.title,actor_name:'Your Loved One',created_at:new Date().toISOString(),acknowledged_by:null,delivery:'simulation'});
    }
    if(op==='ack'){const event=next.events.find(e=>e.id===body['id']);if(event)event.acknowledged_by=next.member.id;}
    if(op==='settings')next.circle={...next.circle,display_name:String(body['display_name']),timezone:String(body['timezone']),summary_time:String(body['summary_time']),preferences:body['preferences'] as CareWorkspace['circle']['preferences']};
    if(op==='reminder'||op==='routine'||op==='note'){
      const id=typeof body['id']==='string'?body['id']:crypto.randomUUID();const list=op==='reminder'?next.reminders:op==='routine'?next.routines:next.notes;
      const before=list.find(x=>x.id===id);next.history.unshift({id:crypto.randomUUID(),entity:String(op),entity_id:id,label:`${before?'Updated':'Added'} ${String(body['title']??body['label'])}`,created_at:new Date().toISOString(),undone_at:null});
      const value=op==='reminder'?{...body,id,detail:body['detail']||null,state:'pending' as CareState,effective_time:String(body['local_time']),version:0,step:0}:op==='routine'?{...body,id,progress:0}:{...body,id,media_path:null,media_kind:null,updated_at:new Date().toISOString()};
      if(op==='reminder')next.reminders=[...next.reminders.filter(x=>x.id!==id),value as unknown as CareWorkspace['reminders'][number]];
      if(op==='routine')next.routines=[...next.routines.filter(x=>x.id!==id),value as unknown as CareWorkspace['routines'][number]];
      if(op==='note')next.notes=[...next.notes.filter(x=>x.id!==id),value as unknown as CareWorkspace['notes'][number]];result={ok:true,id};
    }
    if(op==='delete'){if(body['entity']==='reminder')next.reminders=next.reminders.filter(x=>x.id!==body['id']);if(body['entity']==='routine')next.routines=next.routines.filter(x=>x.id!==body['id']);if(body['entity']==='note')next.notes=next.notes.filter(x=>x.id!==body['id']);}
    if(op==='routine-step'){const routine=next.routines.find(r=>r.id===body['id']);if(routine)routine.progress=Number(body['step']);}
    if(op==='question')return {ok:true,text:body['draft']?String(body['question']).slice(0,160):approvedAnswer(String(body['question']),next.notes),mode:body['draft']?'Draft · not AI':'Approved family notes',requiresApproval:Boolean(body['draft'])};
    if(op==='test-alert')return {ok:true,telegram:'simulation — not sent',email:'simulation — not sent'};
    if(op==='invite')return {ok:true,code:'SAMPLE ONLY',instruction:'Live invitations require private family access.'};
    if(op==='export')return {ok:true,export:next};
    if(op==='media-read')return {ok:true,url:null};
    if(op==='media'||op==='media-remove')throw new Error('Private media requires your real family workspace.');
    if(op==='undo')throw new Error('Change recovery is available in the real family workspace.');
    if(op==='erase')next=sampleWorkspace();
    setData(next);try{localStorage.setItem(DEMO_KEY,JSON.stringify(next));}catch{}return result;
  };
  return <Context.Provider value={{data,demo:true,busy:false,notice,operate,logout}}>{children}</Context.Provider>;
}
