import express from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
export const BFF_PATH='/api/member/liuyao/explanations';
const CAP_PATH='/api/member/liuyao/capability';
const normal=['parent_person','sibling_person','child_person','document','money_acquisition','career_office','house_object'];
const question=z.union([z.object({questionType:z.enum(normal)}).strict(),z.object({questionType:z.enum(['wife_person','husband_person']),traditionalRoleAcknowledged:z.literal(true)}).strict()]);
const schema=z.object({instant:z.number().int().refine(Number.isSafeInteger),timeZone:z.string().min(1).max(100),
  dayRolloverPolicy:z.enum(['civil_midnight','zi_hour_23']),lines:z.array(z.union([z.literal(6),z.literal(7),z.literal(8),z.literal(9)])).length(6),
  question,selection:z.union([z.object({mode:z.literal('unique_or_defer')}).strict(),z.object({mode:z.literal('manual_line'),linePosition:z.number().int().min(1).max(6)}).strict()])}).strict();
const codes=new Set(['INVALID_REQUEST','INVALID_TIMEZONE','UNSUPPORTED_CIVIL','FUTURE_UNVERIFIED','INVALID_SELECTION','RATE_LIMITED','SERVICE_UNAVAILABLE','INTERNAL_ERROR']);
const message=code=>({INVALID_REQUEST:'입력을 확인해 주세요.',INVALID_SELECTION:'선택한 효는 후보가 아닙니다.',RATE_LIMITED:'잠시 후 다시 시도해 주세요.',
  AUTH_REQUIRED:'로그인이 필요합니다.',ACCESS_DENIED:'내부 검증자 권한이 필요합니다.',SERVICE_UNAVAILABLE:'검증 서비스를 사용할 수 없습니다.',
  INTERNAL_ERROR:'검증 요청을 처리하지 못했습니다.',UNSUPPORTED_CIVIL:'지원 범위 이전 시각입니다.',FUTURE_UNVERIFIED:'미검증 미래 시각입니다.',INVALID_TIMEZONE:'시간대를 확인해 주세요.'})[code]||'요청을 확인해 주세요.';
const fail=(res,status,code)=>res.status(status).json({requestId:randomUUID(),error:{code,message:message(code)}});
export function parseWireJSON(raw){
  let i=0;const bad=()=>{throw new Error('INVALID_REQUEST');},ws=()=>{while(i<raw.length&&/\s/u.test(raw[i]))i++;};
  function str(){const start=i++;while(i<raw.length){const c=raw[i++];if(c==='"')return JSON.parse(raw.slice(start,i));if(c==='\\')i++;}bad();}
  function value(depth){if(depth>24)bad();ws();const c=raw[i];if(c==='"'){str();return;}
    if(c==='{'||c==='['){const obj=c==='{',end=obj?'}':']',keys=new Set();i++;ws();if(raw[i]===end){i++;return;}
      while(i<raw.length){if(obj){ws();if(raw[i]!=='"')bad();const key=str();if(keys.has(key))bad();keys.add(key);ws();if(raw[i++]!==':')bad();}
        value(depth+1);ws();if(raw[i]===end){i++;return;}if(raw[i++]!==',')bad();}bad();}
    const m=/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/u.exec(raw.slice(i));if(!m)bad();i+=m[0].length;
  }value(0);ws();if(i!==raw.length)bad();return JSON.parse(raw);
}
export function readLiuyaoConfig(config,env=process.env){
  if(env.LIUYAO_BFF_ENABLED!=='1')return undefined;
  if(env.LIUYAO_BFF_ENV!=='internal_validation'||config.production||!config.configured||
    (env.NODE_ENV!==undefined&&!['development','test'].includes(env.NODE_ENV)))throw new Error('Local BFF disabled');
  let registry;try{registry=JSON.parse(env.LIUYAO_BFF_REGISTRY_JSON||'');}catch{throw new Error('Local BFF disabled');}
  return validateConfiguration({enabled:true,environment:'internal_validation',engineURL:env.LIUYAO_ENGINE_URL,registry},config);
}
export function validateConfiguration(value,config){
  if(!value||value.enabled!==true||value.environment!=='internal_validation'||config.production||!config.configured||
    (process.env.NODE_ENV!==undefined&&!['development','test'].includes(process.env.NODE_ENV)))throw new Error('Local BFF disabled');
  const origin=new URL(config.origin),engine=new URL(value.engineURL);
  if(origin.protocol!=='http:'||origin.hostname!=='127.0.0.1'||engine.protocol!=='http:'||engine.hostname!=='127.0.0.1'||!engine.port||
    engine.pathname!=='/api/private/v1/liuyao/explanations'||engine.username||engine.password||engine.search||engine.hash)throw new Error('Local BFF disabled');
  if(!Array.isArray(value.registry)||value.registry.length<1||value.registry.length>32)throw new Error('Local BFF disabled');
  const subjects=new Set(),validators=new Set(),tokens=new Set();
  const registry=value.registry.map(r=>{
    if(!r||!/^[a-f0-9-]{36}$/iu.test(r.memberId)||!/^[A-Za-z0-9_-]{1,64}$/u.test(r.validatorId)||!/^[a-f0-9]{64}$/u.test(r.token)||/^(.)\1+$/u.test(r.token)||
      !Number.isSafeInteger(r.expiresAt)||r.expiresAt<=Date.now()||r.expiresAt>Date.now()+8*3600000||subjects.has(r.memberId)||validators.has(r.validatorId)||tokens.has(r.token))throw new Error('Local BFF disabled');
    subjects.add(r.memberId);validators.add(r.validatorId);tokens.add(r.token);return Object.freeze({memberId:r.memberId,validatorId:r.validatorId,token:r.token,expiresAt:r.expiresAt});
  });return Object.freeze({enabled:true,environment:'internal_validation',engineURL:engine.href,registry:Object.freeze(registry)});
}
async function boundedJSON(response){
  if(!response.headers.get('content-type')?.startsWith('application/json'))throw new Error('Bad upstream');
  const reader=response.body?.getReader();if(!reader)throw new Error('Bad upstream');let size=0,parts=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536)throw new Error('Bad upstream');parts.push(Buffer.from(value));}
    return JSON.parse(Buffer.concat(parts).toString('utf8'));}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export function installLiuyao(app,{configuration,config,currentUser,guarded}){
  if(!configuration)return;const c=validateConfiguration(configuration,config),registry=new Map(c.registry.map(r=>[r.memberId,r])),quota=new Map(),busy=new Set();
  async function allowed(req,res){
    if(req.socket.remoteAddress!=='127.0.0.1'&&req.socket.remoteAddress!=='::ffff:127.0.0.1'){fail(res,403,'ACCESS_DENIED');return;}
    const user=await currentUser(req,res);if(!user){fail(res,401,'AUTH_REQUIRED');return;}
    const credential=registry.get(user.id);if(!credential||credential.expiresAt<=Date.now()){fail(res,403,'ACCESS_DENIED');return;}
    return credential;
  }
  app.get(CAP_PATH,guarded(async(req,res)=>{if(Object.keys(req.query).length)return fail(res,400,'INVALID_REQUEST');if(await allowed(req,res))res.json({enabled:true,locale:'ko-KR',mode:'private_validation'});}));
  // Installed AFTER existing session/CSRF/Origin and BEFORE the shared JSON parser.
  app.post(BFF_PATH,express.text({type:'application/json',limit:4096,inflate:false}),guarded(async(req,res)=>{
    if(Object.keys(req.query).length||req.get('content-encoding'))return fail(res,400,'INVALID_REQUEST');
    const credential=await allowed(req,res);if(!credential)return;
    const minute=Math.floor(Date.now()/60000),q=quota.get(credential.memberId)||{minute,count:0};if(q.minute!==minute){q.minute=minute;q.count=0;}
    quota.set(credential.memberId,q);if(q.count>=10||busy.has(credential.memberId)){res.set('Retry-After','1');return fail(res,429,'RATE_LIMITED');}q.count++;
    let input;try{input=schema.parse(parseWireJSON(req.body));}catch{return fail(res,400,'INVALID_REQUEST');}
    busy.add(credential.memberId);const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),6000);
    const onDisconnect=()=>{if(!res.writableFinished)abort.abort();};res.once('close',onDisconnect);
    try{
      const response=await fetch(c.engineURL,{method:'POST',redirect:'error',headers:{'content-type':'application/json',authorization:`Bearer ${credential.token}`},body:JSON.stringify(input),signal:abort.signal});
      const data=await boundedJSON(response);
      if(!response.ok){const code=data?.error?.code;
        if(!codes.has(code)||![400,422,429,500,503].includes(response.status))return fail(res,503,'SERVICE_UNAVAILABLE');
        if(response.status===429)res.set('Retry-After','1');return fail(res,response.status,code);}
      const quality=data?.quality;
      if(data.apiVersion!=='private-evidence-v1'||data.locale!=='ko-KR'||!Array.isArray(data.statements)||data.statements.length>138||!data.statements.every(s=>typeof s==='string')||
        quality?.mode!=='private_validation'||quality.dataStatus!=='validation_only'||quality.productionReleaseAuthorized!==false||quality.astronomicalAccuracy!=='not_guaranteed')throw new Error('Bad upstream');
      // Recheck server registry state, not client user/role data, before disclosure.
      if(credential.expiresAt<=Date.now()||registry.get(credential.memberId)!==credential)return fail(res,403,'ACCESS_DENIED');
      const output={apiVersion:'curly-liuyao-preview-v1',requestId:randomUUID(),locale:'ko-KR',statements:[...data.statements],
        quality:{mode:'private_validation',dataStatus:'validation_only',astronomicalAccuracy:'not_guaranteed',productionReleaseAuthorized:false}};
      if(Buffer.byteLength(JSON.stringify(output))>65536)throw new Error('Bad upstream');res.json(output);
    }catch{if(!res.destroyed&&!res.headersSent)fail(res,503,'SERVICE_UNAVAILABLE');}
    finally{clearTimeout(timer);res.off('close',onDisconnect);busy.delete(credential.memberId);}
  }));
  app.use(BFF_PATH,(error,_req,res,next)=>{if(res.headersSent)return next(error);return fail(res,error.type==='entity.too.large'?413:400,'INVALID_REQUEST');});
  return Object.freeze({revoke(memberId){registry.delete(memberId);}});
}
