'use strict';
(() => {
  // Wire input labels only. No engine imports, calculation rules or credentials.
  const route='/api/member/liuyao/explanations';let generation=0,controller=null;
  const panel=document.createElement('section');panel.id='liuyao-validation';panel.hidden=true;panel.className='member-notebook';
  const heading=document.createElement('h2');heading.textContent='육효 내부 검증 · 한국어 설명';panel.append(heading);
  const notice=document.createElement('p');notice.textContent='개발 검증용입니다. 실제 천문 정확도와 길흉을 보장하지 않으며 입력·답변을 저장하지 않습니다.';panel.append(notice);
  const form=document.createElement('form');panel.append(form);
  function select(id,label,items){const holder=document.createElement('label');holder.textContent=label+' ';const field=document.createElement('select');field.id=id;
    for(const [value,text] of items){const option=document.createElement('option');option.value=value;option.textContent=text;field.append(option);}holder.append(field);form.append(holder);return field;}
  function input(id,label,type,value){const holder=document.createElement('label');holder.textContent=label+' ';const field=document.createElement('input');field.id=id;field.type=type;field.value=value;field.required=true;holder.append(field);form.append(holder);return field;}
  const question=select('liuyao-question','질문 유형',[
    ['parent_person','부모 본인'],['sibling_person','형제자매 본인'],['child_person','자녀 본인'],['wife_person','전통 아내 역할'],['husband_person','전통 남편 역할'],
    ['document','문서 상태'],['money_acquisition','금전 취득'],['career_office','관직 획득'],['house_object','주거물 상태']]);
  const ackLabel=document.createElement('label'),ack=document.createElement('input');ack.type='checkbox';ack.id='liuyao-role-ack';ackLabel.append(ack,document.createTextNode(' 전통 배우자 역할을 명시적으로 선택합니다.'));ackLabel.hidden=true;form.append(ackLabel);
  question.addEventListener('change',()=>{ackLabel.hidden=!['wife_person','husband_person'].includes(question.value);ack.checked=false;});
  const lines=[];for(let n=1;n<=6;n++)lines.push(select('liuyao-line-'+n,n===1?'초효 (아래)':n===6?'상효 (위)':n+'효',[[7,'7'],[8,'8'],[6,'6'],[9,'9']]));
  const instant=input('liuyao-instant','Unix milliseconds','number',String(Date.now()));instant.step='1';
  const zone=input('liuyao-zone','IANA 시간대','text','Asia/Seoul');
  const rollover=select('liuyao-rollover','일진 환일', [['civil_midnight','자정'],['zi_hour_23','23시']]);
  const mode=select('liuyao-selection','용신 선택',[['unique_or_defer','단일 자동 선택 / 복수·부재 보류'],['manual_line','수동 효 선택']]);
  const manual=select('liuyao-manual','수동 효 위치',Array.from({length:6},(_,i)=>[String(i+1),String(i+1)+'효']));manual.disabled=true;
  mode.addEventListener('change',()=>manual.disabled=mode.value!=='manual_line');
  const button=document.createElement('button');button.type='submit';button.id='liuyao-submit';button.textContent='검증 설명 요청';form.append(button);
  const status=document.createElement('p');status.id='liuyao-status';status.setAttribute('role','status');panel.append(status);
  const output=document.createElement('ol');output.id='liuyao-statements';panel.append(output);
  document.querySelector('main').append(panel);
  function clear(){generation++;controller?.abort();output.replaceChildren();status.textContent='';button.disabled=false;}
  async function capability(){const version=generation;try{const r=await fetch('/api/member/liuyao/capability',{credentials:'same-origin',cache:'no-store'});const data=await r.json();if(version===generation)panel.hidden=!r.ok||data.enabled!==true;}catch{if(version===generation)panel.hidden=true;}}
  function errorMessage(data){if(typeof data?.error==='object')return data.error.message||'검증 요청을 처리하지 못했습니다.';
    return ({requestRejected:'요청을 확인할 수 없습니다.',signInRequired:'로그인이 필요합니다.',authNotConfigured:'회원 인증이 연결되지 않았습니다.'})[data?.error]||'검증 요청을 처리하지 못했습니다.';}
  form.addEventListener('submit',async event=>{
    event.preventDefault();clear();const version=generation;controller=new AbortController();const ownController=controller;const timer=setTimeout(()=>ownController.abort(),22000);button.disabled=true;
    try{
      const q={questionType:question.value};if(['wife_person','husband_person'].includes(question.value)){if(!ack.checked)throw new Error('전통 역할 선택에 동의해 주세요.');q.traditionalRoleAcknowledged=true;}
      const request={instant:Number(instant.value),timeZone:zone.value,dayRolloverPolicy:rollover.value,lines:lines.map(s=>Number(s.value)),question:q,
        selection:mode.value==='manual_line'?{mode:'manual_line',linePosition:Number(manual.value)}:{mode:'unique_or_defer'}};
      const auth=await fetch('/api/auth/state',{credentials:'same-origin',cache:'no-store',signal:ownController.signal});const state=await auth.json();
      if(version!==generation)return;
      if(!auth.ok||!state.user||!state.csrfToken)throw new Error('로그인이 필요합니다.');
      const r=await fetch(route,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrfToken},body:JSON.stringify(request),signal:ownController.signal});
      const data=await r.json();if(!r.ok)throw new Error(errorMessage(data));if(version!==generation)return;
      if(data.apiVersion!=='curly-liuyao-preview-v1'||!Array.isArray(data.statements)||data.locale!=='ko-KR'||data.quality?.dataStatus!=='validation_only'||data.quality.productionReleaseAuthorized!==false)throw new Error('검증 응답을 확인할 수 없습니다.');
      for(const text of data.statements){if(typeof text!=='string')throw new Error('검증 응답을 확인할 수 없습니다.');const item=document.createElement('li');item.textContent=text;output.append(item);}status.textContent='내부 검증 완료 · validation_only';
    }catch(error){if(version===generation)status.textContent=error.name==='AbortError'?'요청이 취소되었습니다.':error.message;}
    finally{clearTimeout(timer);if(version===generation)button.disabled=false;}
  });
  document.getElementById('member-logout')?.addEventListener('click',()=>{clear();panel.hidden=true;});
  window.addEventListener('focus',()=>{clear();void capability();});
  document.getElementById('member-form')?.addEventListener('submit',()=>setTimeout(capability,1000));
  void capability();
})();
