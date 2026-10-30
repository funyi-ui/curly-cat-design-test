import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fixture,BFF,input,priorCases} from './liuyao-fixture.mjs';
import {readLiuyaoConfig,parseWireJSON,validateConfiguration} from '../liuyao.mjs';

test('BFF existing member session and independent engine Bearer produce minimal response',async t=>{
  const f=await fixture(t),a=await f.logged();const r=await a.request(BFF,input);assert.equal(r.status,200);
  assert.deepEqual(Object.keys(r.data).sort(),['apiVersion','locale','quality','requestId','statements']);assert.equal(r.data.quality.dataStatus,'validation_only');
  const text=JSON.stringify(r.data);for(const s of [f.engineTokens.A,'sourceField','relationId','explanationTemplateId','evidenceIds',f.users.A.email])assert.ok(!text.includes(s));
});
test('BFF unauthenticated and non-validator accounts cannot call engine',async t=>{
  const f=await fixture(t),anonymous=f.browser();await anonymous.request('/api/auth/state');assert.equal((await anonymous.request(BFF,input)).status,401);
  const c=await f.logged('C');assert.equal((await c.request(BFF,input)).status,403);assert.equal(f.engine.auditSnapshot().length,0);
});
test('BFF CSRF and Origin checks remain mandatory before forwarding',async t=>{
  const f=await fixture(t),a=await f.logged();assert.equal((await a.request(BFF,input,{'x-csrf-token':''})).status,403);
  assert.equal((await a.request(BFF,input,{origin:'https://evil.example'})).status,403);assert.equal(f.engine.auditSnapshot().length,0);
});
test('BFF disabled by default, rejects operation environment, URLs and unconfigured auth',()=>{
  assert.equal(readLiuyaoConfig({production:false,configured:true},{}),undefined);
  for(const env of [{LIUYAO_BFF_ENABLED:'1'},{LIUYAO_BFF_ENABLED:'1',LIUYAO_BFF_ENV:'production'},{LIUYAO_BFF_ENABLED:'1',LIUYAO_BFF_ENV:'internal_validation',NODE_ENV:'production'}])assert.throws(()=>readLiuyaoConfig({production:false,configured:true},env));
  assert.throws(()=>validateConfiguration({enabled:true,environment:'internal_validation',engineURL:'http://example.com/api/private/v1/liuyao/explanations'}, {production:false,configured:true,origin:'http://127.0.0.1:5173'}));
});
test('BFF route unavailable when no explicitly supplied configuration',async t=>{
  const f=await fixture(t,{enabled:false}),a=await f.logged();assert.equal((await a.request(BFF,input)).status,404);assert.equal(f.engine.auditSnapshot().length,0);
});
test('BFF capability reveals minimal boolean only to allowed member',async t=>{
  const f=await fixture(t),a=await f.logged(),c=await f.logged('C');assert.deepEqual((await a.request('/api/member/liuyao/capability')).data,{enabled:true,locale:'ko-KR',mode:'private_validation'});
  assert.equal((await c.request('/api/member/liuyao/capability')).status,403);
});
test('BFF does not forward browser authentication headers to engine',async t=>{
  const f=await fixture(t),a=await f.logged(),original=globalThis.fetch;let forwarded;
  const stub=mock.method(globalThis,'fetch',(url,options)=>{if(url===f.engineURL)forwarded=options.headers;return original(url,options);});
  try{assert.equal((await a.request(BFF,input)).status,200);assert.deepEqual(Object.keys(forwarded).sort(),['authorization','content-type']);assert.equal(forwarded.authorization,`Bearer ${f.engineTokens.A}`);}finally{stub.mock.restore();}
});
test('BFF logout and validator revocation prevent future access',async t=>{
  const f=await fixture(t),a=await f.logged();f.app.locals.liuyaoControl.revoke(f.users.A.id);assert.equal((await a.request(BFF,input)).status,403);
  const b=await f.logged('B');await b.request('/api/auth/logout',{});assert.equal((await b.request(BFF,input)).status,403);
  await b.request('/api/auth/state');assert.equal((await b.request(BFF,input)).status,401);
});
test('BFF preserves no-candidate and manual/deferred statuses across all 27 scenarios',async t=>{
  let count=0;for(const c of priorCases()){
    const f=await fixture(),a=await f.logged();try{
      const q={instant:c.input.instant,timeZone:c.input.timeZone,dayRolloverPolicy:c.input.dayRolloverPolicy,lines:c.input.lines,question:{questionType:c.input.question},selection:c.input.manual===undefined?{mode:'unique_or_defer'}:{mode:'manual_line',linePosition:c.input.manual}};
      const r=await a.request(BFF,q);assert.equal(r.status,200);assert.deepEqual(r.data.statements,c.sentences.map(s=>s.text));count++;
    }finally{await f.close();}
  }assert.equal(count,27);t.diagnostic('BFF normal cases exact match: 27/27 (existing auth test doubles, real loopback engine)');
});
for(const [name,edit] of [['unknown property',b=>b.userId='other'],['number coercion',b=>b.instant=String(b.instant)],['wrong six lines',b=>b.lines=[7]],['unsupported question',b=>b.question={questionType:'guess'}],['spouse without consent',b=>b.question={questionType:'wife_person'}]])
  test(`BFF strict input rejects ${name}`,async t=>{const f=await fixture(t),a=await f.logged(),b=structuredClone(input);edit(b);assert.equal((await a.request(BFF,b)).status,400);assert.equal(f.engine.auditSnapshot().length,0);});
test('BFF duplicate raw keys and oversized body fail without engine call',async t=>{
  const f=await fixture(t),a=await f.logged();assert.equal((await a.request(BFF,'{"instant":1,"instant":2}')).status,400);
  assert.equal((await a.request(BFF,' '.repeat(4097))).status,413);assert.equal(f.engine.auditSnapshot().length,0);
  assert.throws(()=>parseWireJSON('{"x":1,"\\u0078":2}'));
});
test('BFF per-member quota counts invalid requests and does not authenticate by supplied identity',async t=>{
  const f=await fixture(t),a=await f.logged();for(let i=0;i<10;i++)assert.equal((await a.request(BFF,{})).status,400);
  assert.equal((await a.request(BFF,input)).status,429);const b=await f.logged('B');assert.equal((await b.request(BFF,input)).status,200);
});
test('BFF sanitized upstream credentials failure is service unavailable, not website logout',async t=>{
  const f=await fixture(t),a=await f.logged();f.engine.revokeValidator('validator-A');const r=await a.request(BFF,input);assert.equal(r.status,503);assert.equal(r.data.error.code,'SERVICE_UNAVAILABLE');
  assert.equal((await a.request('/api/auth/state')).data.user.id,f.users.A.id);
});
test('BFF projection excludes malicious upstream extras and rejects oversized/error contents',async t=>{
  const f=await fixture(t),a=await f.logged(),original=globalThis.fetch;
  const result={apiVersion:'private-evidence-v1',locale:'ko-KR',statements:['구조적 관계 설명입니다.'],sourceField:'PRIVATE_PATH',relationId:'SECRET',
    quality:{mode:'private_validation',dataStatus:'validation_only',astronomicalAccuracy:'not_guaranteed',productionReleaseAuthorized:false}};
  let value=result;const stub=mock.method(globalThis,'fetch',(url,options)=>url===f.engineURL?Promise.resolve(new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}})):original(url,options));
  try{const r=await a.request(BFF,input);assert.equal(r.status,200);assert.ok(!JSON.stringify(r.data).includes('PRIVATE_PATH'));value={...result,statements:['x'.repeat(66000)]};assert.equal((await a.request(BFF,input)).status,503);}finally{stub.mock.restore();}
});
test('BFF actual frontend allowlist excludes backend, engine, source maps and secret paths',async t=>{
  const f=await fixture(t);for(const p of ['/backend/liuyao.mjs','/dist/src/api/index.js','/data/solar-validation-v1/table.json','/.env','/liuyao.js.map'])assert.equal((await fetch(f.base+p)).status,404);
  for(const asset of ['index.html','app.js','member.js','liuyao.js']){const r=await fetch(f.base+'/'+asset);assert.equal(r.status,200);const text=await r.text();for(const secret of [f.engineTokens.A,'sourceField','explanationTemplateId','canonicalTableJSON','/api/private/v1/liuyao'])assert.ok(!text.includes(secret));}
  const ui=readFileSync(new URL('../../frontend/liuyao.js',import.meta.url),'utf8');assert.ok(!/\bimport\s|require\s*\(|import\s*\(/u.test(ui));assert.ok(!/innerHTML|localStorage|sessionStorage/u.test(ui));
});
test('BFF all nine explicit question policies reach engine with approved six-relation wording',async()=>{
  const cases=[['parent_person','부모(父母)'],['sibling_person','형제(兄弟)'],['child_person','자손(子孫)'],['wife_person','처재(妻財)'],
    ['husband_person','관귀(官鬼)'],['document','부모(父母)'],['money_acquisition','처재(妻財)'],['career_office','관귀(官鬼)'],['house_object','부모(父母)']];
  for(const [id,label] of cases){const f=await fixture(),a=await f.logged();try{const question=['wife_person','husband_person'].includes(id)?{questionType:id,traditionalRoleAcknowledged:true}:{questionType:id};
    const r=await a.request(BFF,{...input,question});assert.equal(r.status,200);assert.ok(r.data.statements[0].includes(`대응 육친은 ${label}에 해당합니다.`));
  }finally{await f.close();}}
});
test('BFF actually served script graph has no engine or backend module import edges',async t=>{
  const f=await fixture(t),require=createRequire(new URL('../../../liuyao-engine/package.json',import.meta.url)),ts=require('typescript');
  const html=await fetch(f.base+'/').then(r=>r.text()),entries=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/gu)].map(m=>m[1]);
  assert.equal(entries.length,5);assert.ok(entries.includes('liuyao.js'));
  for(const entry of entries){assert.match(entry,/^[\w-]+\.js$/u);const response=await fetch(f.base+'/'+entry);assert.equal(response.status,200);const source=await response.text();
    const parsed=ts.createSourceFile(entry,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
    function visit(node){assert.ok(!ts.isImportDeclaration(node)&&!ts.isExportDeclaration(node));
      if(ts.isCallExpression(node))assert.ok(node.expression.kind!==ts.SyntaxKind.ImportKeyword&&!(ts.isIdentifier(node.expression)&&node.expression.text==='require'));
      ts.forEachChild(node,visit);}
    visit(parsed);for(const secret of [f.engineTokens.A,'/api/private/v1/liuyao','canonicalTableJSON','explanationTemplateId','sourceField'])assert.ok(!source.includes(secret));
  }
});
