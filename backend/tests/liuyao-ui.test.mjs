import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../frontend/liuyao.js',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function boot({enabled=true,hold=false,authHold=false}={}){
  const nodes=new Map(),requests=[],pending=[];
  function node(tag){const n={tag,children:[],listeners:{},hidden:false,disabled:false,value:'',textContent:'',checked:false,
    addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(){},append(...items){this.children.push(...items);if(this.tag==='select'&&!this.value&&items[0])this.value=String(items[0].value);},replaceChildren(){this.children=[];}};
    Object.defineProperty(n,'id',{get(){return this._id;},set(v){this._id=v;nodes.set(v,this);}});return n;}
  const main=node('main'),logout=node('button'),memberForm=node('form');nodes.set('member-logout',logout);nodes.set('member-form',memberForm);
  const document={createElement:node,createTextNode:s=>({textContent:s}),querySelector:s=>s==='main'?main:null,getElementById:id=>nodes.get(id)};
  const windows={};const context=vm.createContext({document,window:{addEventListener:(n,fn)=>windows[n]=fn},Date,AbortController,AbortSignal,setTimeout,clearTimeout,
    fetch:async(path,options={})=>{
      requests.push({path,options});if(path.endsWith('/capability'))return {ok:enabled,json:async()=>({enabled})};
      if(path==='/api/auth/state'){const result={ok:true,json:async()=>({user:{id:'test'},csrfToken:'test-csrf'})};return authHold?new Promise(resolve=>pending.push(()=>resolve(result))):result;}
      const response={ok:true,json:async()=>({apiVersion:'curly-liuyao-preview-v1',locale:'ko-KR',statements:['<script>literal text</script>','후보는 보류 상태입니다.'],quality:{dataStatus:'validation_only',productionReleaseAuthorized:false}})};
      if(hold)return new Promise(resolve=>pending.push(()=>resolve(response)));return response;
    }});
  vm.runInContext(source,context);return {nodes,main,requests,logout,windows,pending,form:main.children[0].children.find(n=>n.tag==='form')};
}
test('BFF UI disabled capability stays hidden and contains no engine/auth secret storage',async()=>{
  const u=boot({enabled:false});await tick();assert.equal(u.nodes.get('liuyao-validation').hidden,true);
  assert.doesNotMatch(source,/innerHTML|localStorage|sessionStorage|Bearer |\/api\/private|sourceField|explanationTemplateId/);
});
test('BFF UI wire order, CSRF and safe text rendering use website routes only',async()=>{
  const u=boot();await tick();assert.equal(u.nodes.get('liuyao-validation').hidden,false);
  for(let n=1;n<=6;n++)u.nodes.get('liuyao-line-'+n).value=String([6,7,8,9,7,8][n-1]);
  await u.form.listeners.submit({preventDefault(){}});const sent=u.requests.find(r=>r.path.endsWith('/explanations'));
  assert.deepEqual(JSON.parse(sent.options.body).lines,[6,7,8,9,7,8]);assert.equal(sent.options.credentials,'same-origin');assert.equal(sent.options.headers['X-CSRF-Token'],'test-csrf');
  assert.equal(u.nodes.get('liuyao-statements').children[0].textContent,'<script>literal text</script>');
  assert.ok(u.requests.every(r=>r.path.startsWith('/api/')));assert.ok(!u.requests.some(r=>r.options.headers?.Authorization));
});
test('BFF UI logout discards a late response and clears input-derived display',async()=>{
  const u=boot({hold:true});await tick();const work=u.form.listeners.submit({preventDefault(){}});await tick();u.logout.listeners.click();
  u.pending[0]();await work;assert.equal(u.nodes.get('liuyao-validation').hidden,true);assert.equal(u.nodes.get('liuyao-statements').children.length,0);
});
test('BFF UI logout during session check prevents subsequent calculation request',async()=>{
  const u=boot({authHold:true});await tick();const work=u.form.listeners.submit({preventDefault(){}});await tick();u.logout.listeners.click();u.pending[0]();await work;
  assert.ok(!u.requests.some(r=>r.path.endsWith('/explanations')));
});
