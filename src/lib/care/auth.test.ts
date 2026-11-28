import {describe,it,expect} from 'vitest';
import {verifyTelegramLaunch,careHash} from './auth.server';
async function launch(){
  const pair=await crypto.subtle.generateKey({name:'Ed25519'},true,['sign','verify']);const raw=await crypto.subtle.exportKey('raw',pair.publicKey);const key=[...new Uint8Array(raw)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const params=new URLSearchParams({auth_date:'1795826400',user:JSON.stringify({id:42,first_name:'Anna'})});
  const check=[...params.entries()].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>`${k}=${v}`).join('\n');
  const sig=await crypto.subtle.sign('Ed25519',pair.privateKey,new TextEncoder().encode(`123:WebAppData\n${check}`));
  params.set('signature',btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''));
  return {params,key,now:1795826400000};
}
const tests=describe;
tests('Telegram family verification',()=>{
  it('accepts an actual signed launch for the correct bot',async()=>{const f=await launch();expect(await verifyTelegramLaunch(f.params.toString(),'123',f.now,f.key)).toEqual({id:42,name:'Anna'});});
  it('rejects tampered user IDs',async()=>{const f=await launch();f.params.set('user',JSON.stringify({id:99}));expect(await verifyTelegramLaunch(f.params.toString(),'123',f.now,f.key)).toBeNull();});
  it('rejects launches for another bot',async()=>{const f=await launch();expect(await verifyTelegramLaunch(f.params.toString(),'456',f.now,f.key)).toBeNull();});
  it('rejects launches older than five minutes',async()=>{const f=await launch();expect(await verifyTelegramLaunch(f.params.toString(),'123',f.now+300001,f.key)).toBeNull();});
  it('rejects future-dated launches over 30 seconds',async()=>{const f=await launch();expect(await verifyTelegramLaunch(f.params.toString(),'123',f.now-30001,f.key)).toBeNull();});
  it('rejects duplicate launch fields',async()=>{const f=await launch();f.params.append('user',JSON.stringify({id:1}));expect(await verifyTelegramLaunch(f.params.toString(),'123',f.now,f.key)).toBeNull();});
  it('hashes stored access credentials instead of retaining plaintext',async()=>{expect(await careHash('a-private-access-code')).not.toContain('a-private-access-code');expect((await careHash('a-private-access-code')).length).toBe(64);});
});
