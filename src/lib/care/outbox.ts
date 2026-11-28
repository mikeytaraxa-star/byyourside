import {z} from 'zod';
import {actionSchema} from './schemas';
export const outboxSchema=z.array(actionSchema).max(100);
export type PendingAction=z.infer<typeof actionSchema>;
export function restoreOutbox(raw:string):PendingAction[]{try{const parsed=outboxSchema.safeParse(JSON.parse(raw));return parsed.success?parsed.data:[];}catch{return [];}}
export function appendAction(queue:PendingAction[],action:PendingAction){if(queue.some(a=>a.key===action.key))return queue;if(queue.length>=100)throw new Error('Too many offline actions. Reconnect before continuing.');return [...queue,action];}
export function pendingState<T extends {id:string;status:'pending'|'done'|'missed';careState?:string;time:string}>(rows:T[],queue:PendingAction[],date:string):T[]{return rows.map(row=>{const actions=queue.filter(a=>a.reminderId===row.id&&a.date===date);return actions.reduce((r,a)=>({...r,status:a.action==='done'?'done':r.status,careState:a.action==='done'?'done':a.action==='help'?'help':a.action==='decline'?'declined':a.action==='later'?'postponed':r.careState}),row);});}
