import {describe,it,expect,vi} from 'vitest';
import {eraseFamilyData} from './erase.server';
import type {CareClient} from './auth.server';
describe('complete private family erasure',()=>{
  it('revokes access first and removes orphaned media under the entire family prefix',async()=>{
    const order:string[]=[];const paths=['family-a/deleted-note/orphan-file'];
    const remove=vi.fn(async(items:string[])=>{order.push('remove-media');for(const item of items){const index=paths.indexOf(item);if(index>=0)paths.splice(index,1);}return{error:null};});
    const list=vi.fn(async(prefix:string)=>({error:null,data:prefix==='family-a'&&paths.length?[{name:'deleted-note',id:null}]:prefix==='family-a/deleted-note'?paths.map(()=>({name:'orphan-file',id:'object'})):[]}));
    const query={select:()=>query,eq:()=>query,delete:()=>{order.push('delete-records');return query;},single:async()=>({data:{telegram_chat_id:7},error:null}),then:(resolve:(v:unknown)=>unknown)=>Promise.resolve({error:null}).then(resolve)};
    const client={rpc:vi.fn(async()=>{order.push('revoke-access');return{error:null};}),from:()=>query,storage:{from:()=>({list,remove})}} as unknown as CareClient;
    await eraseFamilyData(client,'family-a');
    expect(order[0]).toBe('revoke-access');
    expect(remove).toHaveBeenCalledWith(['family-a/deleted-note/orphan-file']);
    expect(paths).toEqual([]);expect(order.indexOf('remove-media')).toBeLessThan(order.indexOf('delete-records'));
  });
});