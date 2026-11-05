/* Exercise the input handlers without accessing a browser or network. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
function harness() {
  let now = Date.now();
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  class Element {
    constructor() { this.handlers = {}; this.dataset = {}; this.style = { setProperty() {}, removeProperty() {} }; }
    addEventListener(type, callback) { this.handlers[type] = callback; }
    fire(type, event = {}) { this.handlers[type]?.({ isPrimary: true, button: 0, pointerId: 1, clientX: 0, clientY: 0, detail: 1, ...event }); }
    setAttribute() {}
    getBoundingClientRect() { return { width: 240, height: 160 }; }
    setPointerCapture(id) { this.captured = id; }
    hasPointerCapture(id) { return this.captured === id; }
    releasePointerCapture() { this.captured = null; this.fire('lostpointercapture'); }
  }
  const html = fs.readFileSync(path.join(root, 'earn.html'), 'utf8');
  const nodes = new Map([...html.matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const window = new EventTarget(), map = new Map();
  const context = vm.createContext({ window, Date: Clock, CustomEvent, structuredClone, crypto: require('node:crypto').webcrypto, document: { getElementById(id) { assert.ok(nodes.has(id), `missing actual HTML element ${id}`); return nodes.get(id); } }, localStorage: { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) } });
  vm.runInContext(fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8'), context);
  window.Muda.toast = () => {};
  window.Muda.notifyAchievements = () => {};
  vm.runInContext(fs.readFileSync(path.join(root, 'js/earn.js'), 'utf8'), context);
  return { m: window.Muda, envelope: nodes.get('envelope-action'), button: nodes.get('work-button'), advance() { now += 200; } };
}
test('tap and keyboard activate the same two-step task', () => {
  const h = harness(); h.envelope.fire('click'); assert.equal(h.m.state().workPhase, 'peel'); assert.equal(h.m.state().balance, 0);
  h.advance(); h.envelope.fire('click', { detail: 0 }); assert.equal(h.m.state().workPhase, 'seal'); assert.equal(h.m.state().balance, 10);
  h.advance(); h.button.fire('click'); h.advance(); h.button.fire('click'); assert.equal(h.m.state().balance, 20);
});
test('horizontal seal and upward peel drags complete one round without synthetic-click duplicates', () => {
  const h = harness(); h.envelope.fire('pointerdown'); h.envelope.fire('pointermove', { clientX: 120 }); h.envelope.fire('pointerup', { clientX: 120 }); h.envelope.fire('click');
  assert.equal(h.m.state().workPhase, 'peel'); assert.equal(h.m.state().balance, 0);
  h.advance(); h.envelope.fire('pointerdown'); h.envelope.fire('pointermove', { clientY: -70 }); h.envelope.fire('pointerup', { clientY: -70 }); h.envelope.fire('click');
  assert.equal(h.m.state().balance, 10); assert.equal(h.m.state().workCount, 1); assert.equal(h.m.state().workPhase, 'seal');
});
test('short, wrong-direction and canceled drags do not advance the work', () => {
  const h = harness();
  for (const move of [{ clientX: 30 }, { clientX: -150 }, { clientY: -100 }]) {
    h.envelope.fire('pointerdown'); h.envelope.fire('pointermove', move); h.envelope.fire('pointerup', move); h.envelope.fire('click'); assert.equal(h.m.state().workPhase, 'seal');
  }
  h.envelope.fire('pointerdown'); h.envelope.fire('pointermove', { clientX: 140 }); h.envelope.fire('pointercancel', { clientX: 140 }); h.envelope.fire('click');
  assert.equal(h.m.state().balance, 0); assert.equal(h.m.state().workPhase, 'seal');
});
