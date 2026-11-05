/* Exercise input handlers without accessing a browser or network. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
function harness() {
  let now = Date.now(), nextTimer = 0;
  const timers = new Map(), sounds = [];
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  class Element {
    constructor() { this.handlers = {}; this.dataset = {}; this.style = { setProperty() {}, removeProperty() {} }; }
    addEventListener(type, callback) { this.handlers[type] = callback; }
    fire(type, event = {}) { this.handlers[type]?.({ isPrimary: true, button: 0, pointerId: 1, clientX: 0, clientY: 0, detail: 1, preventDefault() {}, ...event }); }
    setAttribute() {}
    focus() {}
    getBoundingClientRect() { return { width: 240, height: 160 }; }
    setPointerCapture(id) { this.captured = id; }
    hasPointerCapture(id) { return this.captured === id; }
    releasePointerCapture() { this.captured = null; this.fire('lostpointercapture'); }
  }
  const html = fs.readFileSync(path.join(root, 'earn.html'), 'utf8');
  const nodes = new Map([...html.matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const window = new EventTarget(), map = new Map(), documentEvents = {};
  const document = { hidden: false, addEventListener: (type, fn) => { documentEvents[type] = fn; }, getElementById(id) { assert.ok(nodes.has(id), `missing actual HTML element ${id}`); return nodes.get(id); } };
  const context = vm.createContext({ window, document, Date: Clock, CustomEvent, structuredClone, crypto: require('node:crypto').webcrypto, setInterval(fn) { timers.set(++nextTimer, fn); return nextTimer; }, clearInterval: id => timers.delete(id), localStorage: { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) } });
  vm.runInContext(fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8'), context);
  window.Muda.toast = () => {}; window.Muda.notifyAchievements = () => {};
  window.Muda.paperSound = { enabled: true, supported: true, unlock() {}, rub() { sounds.push('rub'); }, finish(type) { sounds.push(type); }, setEnabled(value) { this.enabled = value; } };
  vm.runInContext(fs.readFileSync(path.join(root, 'js/earn.js'), 'utf8'), context);
  return { m: window.Muda, nodes, sounds, document, documentEvents, envelope: nodes.get('envelope-action'), advance(ms = 200) { now += ms; [...timers.values()].forEach(fn => fn()); } };
}
function drag(h, end, type = 'pointerup') { h.envelope.fire('pointerdown'); h.envelope.fire('pointermove', end); h.envelope.fire(type, end); h.envelope.fire('click'); }
test('click, tap, Enter and Space cannot seal or peel the envelope', () => {
  const h = harness();
  for (const phase of ['seal', 'peel']) {
    h.envelope.fire('click'); h.envelope.fire('click', { detail: 0 });
    for (const key of ['Enter', ' ']) { h.envelope.fire('keydown', { key }); h.envelope.fire('keyup', { key }); }
    assert.equal(h.m.state().workPhase, phase); assert.equal(h.m.state().balance, 0);
    if (phase === 'seal') { drag(h, { clientX: 120 }); h.advance(); }
  }
  assert.equal(h.nodes.has('work-button'), false);
});
test('rightward seal and upward peel complete one paid round with matching sounds', () => {
  const h = harness(); drag(h, { clientX: 120 }); assert.equal(h.m.state().workPhase, 'peel'); assert.equal(h.m.state().balance, 0); assert.ok(h.sounds.includes('rub')); assert.ok(h.sounds.includes('seal'));
  h.advance(); drag(h, { clientY: -70 }); assert.equal(h.m.state().balance, 10); assert.equal(h.m.state().workCount, 1); assert.equal(h.m.state().workPhase, 'seal'); assert.equal(h.sounds.filter(s => s === 'peel').length, 1);
});
test('short, wrong-direction, sideways and canceled gestures do not complete either phase', () => {
  const h = harness();
  for (const end of [{ clientX: 30 }, { clientX: -150 }, { clientY: -100 }, { clientX: 120, clientY: 150 }]) { drag(h, end); assert.equal(h.m.state().workPhase, 'seal'); }
  drag(h, { clientX: 140 }, 'pointercancel'); assert.equal(h.m.state().workPhase, 'seal');
  drag(h, { clientX: 120 }); h.advance();
  for (const end of [{ clientY: -20 }, { clientY: 100 }, { clientX: 120 }, { clientX: 100, clientY: -70 }]) { drag(h, end); assert.equal(h.m.state().workPhase, 'peel'); }
  drag(h, { clientY: -70 }, 'pointercancel'); assert.equal(h.m.state().balance, 0); assert.ok(!h.sounds.includes('peel'));
});
test('moving back before release and losing pointer capture do not pay', () => {
  const h = harness(); drag(h, { clientX: 120 }); h.advance();
  h.envelope.fire('pointerdown'); h.envelope.fire('pointermove', { clientY: -90 }); h.envelope.fire('pointerup', { clientY: -10 }); assert.equal(h.m.state().balance, 0);
  h.envelope.fire('pointerdown'); h.envelope.fire('pointermove', { clientY: -90 }); h.envelope.fire('lostpointercapture'); h.envelope.fire('pointerup', { clientY: -90 }); assert.equal(h.m.state().balance, 0);
});
test('keyboard requires a sustained directional hold and release; blur cancels it', () => {
  const h = harness(); h.envelope.fire('keydown', { key: 'ArrowRight' }); h.advance(100); h.envelope.fire('keyup', { key: 'ArrowRight' }); assert.equal(h.m.state().workPhase, 'seal');
  h.envelope.fire('keydown', { key: 'ArrowUp' }); h.advance(800); h.envelope.fire('keyup', { key: 'ArrowUp' }); assert.equal(h.m.state().workPhase, 'seal');
  h.envelope.fire('keydown', { key: 'ArrowRight' }); h.advance(800); assert.equal(h.m.state().workPhase, 'seal'); h.envelope.fire('keyup', { key: 'ArrowRight' }); assert.equal(h.m.state().workPhase, 'peel');
  h.envelope.fire('keydown', { key: 'ArrowUp' }); h.advance(800); h.envelope.fire('blur'); h.envelope.fire('keyup', { key: 'ArrowUp' }); assert.equal(h.m.state().balance, 0);
  h.envelope.fire('keydown', { key: 'ArrowUp' }); h.advance(800); h.envelope.fire('keyup', { key: 'ArrowUp' }); assert.equal(h.m.state().balance, 10);
});
test('hiding the page cancels active gestures and sound toggle changes only sound', () => {
  const h = harness(); h.nodes.get('paper-sound-toggle').fire('click'); assert.equal(h.m.paperSound.enabled, false); assert.equal(h.m.state().balance, 0);
  h.envelope.fire('pointerdown'); h.envelope.fire('pointermove', { clientX: 120 }); h.document.hidden = true; h.documentEvents.visibilitychange(); h.envelope.fire('pointerup', { clientX: 120 }); assert.equal(h.m.state().workPhase, 'seal');
});
