'use strict';
const $ = id => document.getElementById(id);
const LANGUAGE_KEY = 'curly-cat-language';
const topicKeys = ['today', 'love', 'work'];
function supportedLanguage(tag) {
  if (typeof tag !== 'string') return null;
  const base = tag.toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(LOCALES, base) ? base : null;
}
function initialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (Object.hasOwn(LOCALES, saved)) return saved;
  } catch { /* Preference storage can be blocked; browsing still works. */ }
  for (const tag of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const supported = supportedLanguage(tag);
    if (supported) return supported;
  }
  return 'en';
}
let language = initialLanguage(), topic = 'today', picked = null, hand = [];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let motion = !reduced.matches;
const copy = () => LOCALES[language];
const t = key => copy().ui[key];
function randomIndex(n) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}
function renderReading() {
  const hasResult = picked !== null;
  $('result').hidden = !hasResult;
  $('deck').hidden = hasResult;
  $('table-reading').hidden = !hasResult;
  $('deck-note').hidden = hasResult;
  $('step').textContent = t(hasResult ? 'resultStep' : 'pickStep');
  $('cat-caption').textContent = t(hasResult ? 'resultCaption' : 'caption');
  if (!hasResult) return;
  const c = copy().cards[picked], meta = CARD_META[picked];
  $('result-number').textContent = meta.number;
  $('result-title').textContent = c[0];
  $('result-en').textContent = c[1];
  $('result-symbol').textContent = meta.symbol;
  $('table-symbol').textContent = meta.symbol;
  $('table-title').textContent = c[0];
  $('result-text').textContent = c[2] + (topic === 'love' ? ' ' + c[4] : topic === 'work' ? ' ' + c[5] : '');
  $('result-action').textContent = t('actionLabel') + ' · ' + c[3];
}
function motionLabel() {
  $('motion').textContent = t(motion ? 'motionOff' : 'motionOn');
  $('motion').setAttribute('aria-pressed', String(!motion));
  document.documentElement.classList.toggle('motion-paused', !motion);
  if (!motion) {
    document.querySelectorAll('.eye i').forEach(p => p.style.transform = 'translate(0,0)');
    $('cat').classList.remove('blink');
  }
}
function setLanguage(value, persist = true) {
  if (!Object.hasOwn(LOCALES, value)) return false;
  language = value;
  if (persist) { try { localStorage.setItem(LANGUAGE_KEY, value); } catch {} }
  document.documentElement.lang = value;
  document.title = t('title');
  document.querySelector('meta[name="description"]').setAttribute('content', t('description'));
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = (el.classList.contains('brand') ? '✳ ' : '') + t(el.dataset.i18n);
  });
  $('language').value = value;
  $('language').setAttribute('aria-label', t('language'));
  $('topics').setAttribute('aria-label', t('topicsLabel'));
  $('cat-img').alt = t('catAlt');
  $('greet').setAttribute('aria-label', t('greetLabel'));
  document.querySelectorAll('[data-card]').forEach(b => b.setAttribute('aria-label', copy().drawLabels[Number(b.dataset.card)]));
  $('question').textContent = copy().questions[topic];
  motionLabel();
  renderReading();
  return true;
}
function shuffle() {
  const pool = CARD_META.map((_, i) => i);
  hand = [];
  for (let i = 0; i < 3; i++) hand.push(pool.splice(randomIndex(pool.length), 1)[0]);
  picked = null;
  renderReading();
}
function setTopic(value) {
  if (!topicKeys.includes(value)) throw new Error(t('invalidTopic'));
  topic = value;
  document.querySelectorAll('.topic').forEach(b => {
    const active = b.dataset.topic === topic;
    b.classList.toggle('selected', active);
    b.setAttribute('aria-pressed', String(active));
  });
  $('question').textContent = copy().questions[topic];
  shuffle();
  return {topic};
}
function draw(position) {
  if (!Number.isInteger(position) || position < 0 || position > 2) throw new Error(t('invalidPosition'));
  if (picked !== null) throw new Error(t('alreadyDrawn'));
  picked = hand[position];
  renderReading();
  $('result').focus({preventScroll: true});
  const c = copy().cards[picked];
  return {language, topic, card: c[0], message: $('result-text').textContent, action: c[3]};
}
$('greet').addEventListener('click', () => { $('cat-caption').textContent = t('greeting'); });
$('language').addEventListener('change', e => setLanguage(e.target.value));
document.querySelectorAll('.topic').forEach(b => b.addEventListener('click', () => setTopic(b.dataset.topic)));
document.querySelectorAll('[data-card]').forEach(b => b.addEventListener('click', () => draw(Number(b.dataset.card))));
$('again').addEventListener('click', () => { shuffle(); document.querySelector('[data-card]').focus({preventScroll: true}); });
$('motion').addEventListener('click', () => { motion = !motion; motionLabel(); });
reduced.addEventListener('change', e => { motion = !e.matches; motionLabel(); });
function gaze(x, y) {
  if (!motion) return;
  document.querySelectorAll('.eye').forEach(e => {
    const r = e.getBoundingClientRect(), dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    const len = Math.max(1, Math.hypot(dx, dy)), amount = Math.min(1, len / 220);
    e.firstElementChild.style.transform = `translate(${dx / len * amount * r.width * .19}px,${dy / len * amount * r.height * .12}px)`;
  });
}
document.addEventListener('pointermove', e => gaze(e.clientX, e.clientY), {passive: true});
document.addEventListener('pointerdown', e => gaze(e.clientX, e.clientY), {passive: true});
document.documentElement.addEventListener('pointerleave', () => document.querySelectorAll('.eye i').forEach(p => p.style.transform = 'translate(0,0)'));
setInterval(() => {
  if (motion && !document.hidden) { $('cat').classList.add('blink'); setTimeout(() => $('cat').classList.remove('blink'), 150); }
}, 4300);
setLanguage(language, false);
shuffle();
if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'draw_tarot_card', title: 'Draw a tarot card',
      description: 'Shuffle and draw one card for the selected topic. Show and return the reading in the current page language.',
      inputSchema: {type: 'object', properties: {topic: {type: 'string', enum: topicKeys}, position: {type: 'integer', minimum: 0, maximum: 2}}, required: ['topic', 'position'], additionalProperties: false},
      annotations: {readOnlyHint: false, untrustedContentHint: false},
      execute(input) {
        if (!input || !topicKeys.includes(input.topic) || !Number.isInteger(input.position) || input.position < 0 || input.position > 2) throw new Error(t('invalidInput'));
        setTopic(input.topic);
        return draw(input.position);
      }
    })).catch(() => {});
  } catch {}
}
