import session from 'express-session';
import { randomBytes,randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from '../app.mjs';
const root=fileURLToPath(new URL('../../../liuyao-engine/',import.meta.url));
const require=createRequire(root+'/package.json');
const {createPrivateValidationServer}=require(root+'/dist/src/server/http/privateServer.js');
export const BFF='/api/member/liuyao/explanations';
export const input={instant:Date.parse('2024-02-04T12:00Z'),timeZone:'Asia/Seoul',dayRolloverPolicy:'civil_midnight',lines:[7,7,9,7,7,9],question:{questionType:'parent_person'},selection:{mode:'unique_or_defer'}};
export function priorCases(){return JSON.parse(readFileSync(root+'/docs/research/evidence-e2e-validation-phase5e-text-finalized-cases.json','utf8')).results.filter(r=>r.sentences.length);}
// Existing authentication provider boundary and MemoryStore are TEST DOUBLES ONLY.
// backend/server.mjs never imports this file and never enables MemoryStore.
export async function fixture(t,{enabled=true,fetchOverride}={}){
  const users={A:{id:randomUUID(),email:'a@example.test'},B:{id:randomUUID(),email:'b@example.test'},C:{id:randomUUID(),email:'c@example.test'}};
  const tokens=new Map(),engineTokens={A:randomBytes(32).toString('hex'),B:randomBytes(32).toString('hex')};
  const issue=u=>{const access_token=randomUUID(),refresh_token=randomUUID();tokens.set(access_token,u);tokens.set(refresh_token,u);return {user:u,access_token,refresh_token,expires_at:Math.floor(Date.now()/1000)+3600};};
  const provider={async login({email,password}){const u=Object.values(users).find(u=>u.email===email);return u&&password==='TestOnlyPassword123'?{data:{session:issue(u)}}:{error:{status:401}};},
    async getUser(token){return tokens.has(token)?{data:{user:tokens.get(token)}}:{error:{status:401}};},async refresh(token){return tokens.has(token)?{data:{session:issue(tokens.get(token))}}:{error:{status:401}};},
    async logout(pair){tokens.delete(pair.access_token);tokens.delete(pair.refresh_token);return {};},async signup(){return {data:{session:null}};}};
  const canonicalTableJSON=readFileSync(root+'/data/solar-validation-v1/table.json','utf8'),tableSHA256=readFileSync(root+'/data/solar-validation-v1/table.json.sha256','utf8').trim();
  const engine=createPrivateValidationServer({environment:'internal_validation',enabled:true,canonicalTableJSON,tableSHA256,
    validators:['A','B'].map(k=>({id:'validator-'+k,token:engineTokens[k],permissions:['liuyao:private-validation'],expiresAt:Date.now()+3600000}))});
  let server;try{
    const address=await engine.listen(),engineURL=address+'/api/private/v1/liuyao/explanations';
    const config={configured:true,production:false,sessionSecret:randomBytes(48).toString('hex'),origin:'http://127.0.0.1:5173'};
    const liuyao=enabled?{enabled:true,environment:'internal_validation',engineURL,registry:['A','B'].map(k=>({memberId:users[k].id,validatorId:'validator-'+k,token:engineTokens[k],expiresAt:Date.now()+3600000}))}:undefined;
    const app=createApp({config,store:new session.MemoryStore(),provider,liuyao,limits:{api:1000,login:1000,email:1000}});
    server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}`;config.origin=base;
    async function close(){if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});await engine.close();}
    if(t)t.after(close);
    function browser(){let cookie='',csrf='';return {get cookie(){return cookie;},get csrf(){return csrf;},async request(p,body,headers={}){
      const r=await fetch(base+p,{method:body===undefined?'GET':'POST',headers:{...(cookie?{cookie}:{}),...(body===undefined?{}:{origin:base,'content-type':'application/json','x-csrf-token':csrf}),...headers},
        body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)});const set=r.headers.get('set-cookie');if(set)cookie=set.split(';')[0];
      const data=await r.json();if(data.csrfToken)csrf=data.csrfToken;return {status:r.status,data,headers:r.headers};}};}
    async function logged(k='A'){const b=browser();await b.request('/api/auth/state');const r=await b.request('/api/auth/login',{email:users[k].email,password:'TestOnlyPassword123'});if(r.status!==200)throw new Error('Test login failed');return b;}
    return {base,config,app,users,engineTokens,engineURL,engine,provider,browser,logged,close};
  }catch(e){if(server)server.close();await engine.close();throw e;}
}
