const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function boot(languages = ['ko-KR'], saved = null, blocked = false) {
  const elements = [];
  for (const match of html.matchAll(/<([a-z][\w-]*)\b([^<>]*)>/gi)) {
    const attrs = Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    const classes = new Set((attrs.class || '').split(' '));
    const el = {attrs, dataset: {}, textContent: '', hidden: /\bhidden\b/.test(match[2]), style: {}, listeners: {}, classList: {contains: c => classes.has(c), toggle(c, on) {on ? classes.add(c) : classes.delete(c);}, add(c) {classes.add(c);}, remove(c) {classes.delete(c);}}, setAttribute(k,v) {this.attrs[k]=v;}, addEventListener(k,f) {this.listeners[k]=f;}, focus() {}};
    for (const [k,v] of Object.entries(attrs)) if(k.startsWith('data-')) el.dataset[k.slice(5)] = v;
    elements.push(el);
  }
  function queryAll(selector) {
    if(selector.startsWith('.')) return elements.filter(e => e.classList.contains(selector.slice(1)));
    if(selector==='meta[name="description"]') return elements.filter(e => e.attrs.name==='description');
    const attr=selector.slice(1,-1);return elements.filter(e=>Object.hasOwn(e.attrs,attr));
  }
  const document = {getElementById: id => elements.find(e=>e.attrs.id===id), querySelectorAll:queryAll, querySelector:s=>queryAll(s)[0], documentElement:{lang:'ko',classList:{toggle(){}},addEventListener(){}}, addEventListener(){}, hidden:false};
  let stored=saved;
  const context=vm.createContext({document,navigator:{languages,language:languages[0]},localStorage:{getItem(){if(blocked)throw Error('blocked');return stored;},setItem(k,v){if(blocked)throw Error('blocked');stored=v;}},crypto:require('node:crypto').webcrypto,matchMedia:()=>({matches:false,addEventListener(){}}),setInterval(){},setTimeout(){}});
  for(const file of ['i18n.js','member-locales.js','app.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  return {document,context,run:code=>vm.runInContext(code,context),stored:()=>stored,elements};
}
for(const [tags,saved,expected] of [
 [['ko-KR'],null,'ko'],[['en-GB'],null,'en'],[['id-ID'],null,'id'],[['fr-CA'],null,'fr'],[['es-MX'],null,'es'],[['ja-JP'],null,'en'],[['de-DE','fr-FR'],null,'fr'],[['fr-FR'],'es','es'],[['id-ID'],'invalid','id'],[[],null,'en']
]) {const b=boot(tags,saved);assert.equal(b.document.documentElement.lang,expected);}
const b=boot();
const data=b.run('LOCALES');
const keys=Object.keys(data.ko.ui).sort();
for(const language of ['ko','en','id','fr','es']) {
  const pack=data[language];assert.deepEqual(Object.keys(pack.ui).sort(),keys);
  assert.equal(pack.cards.length,12);assert.equal(pack.drawLabels.length,3);
  for(const c of pack.cards){assert.equal(c.length,6);for(const text of c)assert.equal(typeof text,'string');}
  b.run(`setLanguage('${language}')`);
  assert.equal(b.stored(),language);
  assert.equal(b.document.getElementById('greet').attrs['aria-label'],pack.ui.greetLabel);
  b.document.getElementById('greet').listeners.click();
  assert.equal(b.document.getElementById('cat-caption').textContent,pack.ui.greeting);
  assert.equal(b.document.title,pack.ui.title);
  assert.equal(b.document.querySelector('meta[name="description"]').attrs.content,pack.ui.description);
  for(const e of b.document.querySelectorAll('[data-i18n]')) assert.equal(e.textContent,(e.classList.contains('brand')?'✳ ':'')+pack.ui[e.dataset.i18n]);
  for(const topic of ['today','love','work']) {
    for(let i=0;i<12;i++) {
      b.run(`setTopic('${topic}'); hand=[${i},${(i+1)%12},${(i+2)%12}]; draw(0)`);
      assert.equal(b.document.getElementById('result-title').textContent,pack.cards[i][0]);
      assert.equal(b.document.getElementById('result').hidden,false);
      assert.equal(b.document.getElementById('deck').hidden,true);
      assert.equal(b.document.getElementById('table-reading').hidden,false);
      assert.equal(b.document.getElementById('table-title').textContent,pack.cards[i][0]);
      assert.equal(b.document.getElementById('cat-caption').textContent,pack.ui.resultCaption);
      const text=b.document.getElementById('result-text').textContent;
      assert(text.startsWith(pack.cards[i][2]));
      if(topic!=='today')assert(text.includes(pack.cards[i][topic==='love'?4:5]));
      assert.throws(()=>b.run('draw(1)'));
    }
  }
}
b.run("setLanguage('en');setTopic('work');draw(1)");
const before=b.run('picked');
for(const lang of ['ko','id','fr','es']){b.run(`setLanguage('${lang}')`);assert.equal(b.run('picked'),before);assert.equal(b.run('topic'),'work');assert.equal(b.document.getElementById('result-title').textContent,data[lang].cards[before][0]);}
b.run('shuffle()');assert.equal(b.document.getElementById('result').hidden,true);assert.equal(b.document.getElementById('deck').hidden,false);assert.equal(b.run('new Set(hand).size'),3);assert.equal(b.document.getElementById('table-reading').hidden,true);
assert.throws(()=>b.run("setTopic('bad')"));assert.throws(()=>b.run('draw(-1)'));assert.equal(b.run("setLanguage('bad')"),false);
const restricted=boot(['fr-FR'],null,true);restricted.run("setLanguage('es');draw(0)");assert.equal(restricted.document.documentElement.lang,'es');
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!/^(data:|https?:|\.\/)/.test(m[1]))assert(fs.existsSync(path.join(root,m[1])));
console.log('PASS: 5 complete locales; 180 localized readings; language detection and English fallback; saved preference; result preservation; blocked storage; reset and validation; local assets. DOM behavior tested with a lightweight harness, not a rendered browser.');
