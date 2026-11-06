const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

function boot(reduced = false) {
  class Element {
    constructor() { this.handlers = {}; this.style = {}; this.attributes = {}; this.children = []; this.capture = null; }
    addEventListener(t, fn) { (this.handlers[t] ||= []).push(fn); }
    fire(t, value = {}) {
      const e = { isPrimary: true, button: 0, pointerId: 1, clientX: 0, clientY: 0, preventDefault() { this.prevented = true; }, stopPropagation() {}, ...value };
      (this.handlers[t] || []).forEach(fn => fn(e)); return e;
    }
    setAttribute(k, v) { this.attributes[k] = v; }
    contains(target) { return !!target?.inside; }
    setPointerCapture(id) { this.capture = id; }
    hasPointerCapture(id) { return this.capture === id; }
    releasePointerCapture() { this.capture = null; this.fire('lostpointercapture'); }
    querySelector() { return this.image ||= {}; }
    set innerHTML(value) { this.html = value; this.children = [...value.matchAll(/<a class="hero-slide"/g)].map(() => new Element()); }
    get innerHTML() { return this.html || ''; }
  }
  const nodes = new Map([...read('index.html').matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const document = new Element(); document.hidden = false; document.getElementById = id => { assert.ok(nodes.has(id), id); return nodes.get(id); };
  const media = new Element(); media.matches = reduced;
  const window = new EventTarget(), map = new Map(), timers = new Map(); let id = 0;
  const context = vm.createContext({ window, document, Date, CustomEvent, structuredClone, matchMedia: () => media,
    setTimeout(fn, ms) { assert.equal(ms, 6000); timers.set(++id, fn); return id; }, clearTimeout: key => timers.delete(key),
    localStorage: { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
  });
  vm.runInContext(read('js/storage.js'), context);
  vm.runInContext(read('js/carousel.js'), context);
  return { nodes, document, media, timers, M: window.Muda, get: id => nodes.get(id), tick() { const [key, fn] = [...timers][0] || []; assert.ok(fn); timers.delete(key); fn(); } };
}

test('carousel renders nine normal products, excludes the secret and wraps with synchronized details', () => {
  const b = boot(), track = b.get('hero-track');
  assert.equal(track.children.length, 9); assert.doesNotMatch(track.innerHTML, /final-envelope/);
  assert.equal(b.get('hero-controls').hidden, false);
  b.get('hero-prev').fire('click');
  assert.equal(b.get('hero-product-name').textContent, '何もしない権利');
  assert.equal(b.get('hero-price').textContent, '¥25,000');
  assert.equal(b.get('hero-position').textContent, '09 / 09');
  assert.equal(b.get('hero-product-name').href, 'product.html?id=right');
  assert.equal(track.children[8].inert, false); assert.equal(track.children[0].tabIndex, -1);
  b.get('hero-next').fire('click'); assert.equal(track.style.transform, 'translateX(-0%)');
  assert.equal(b.get('hero-product-name').textContent, 'ただの石ころの画像');
});
test('autoplay advances every six seconds without live announcements and can stay paused', () => {
  const b = boot(); b.tick();
  assert.equal(b.get('hero-position').textContent, '02 / 09');
  assert.equal(b.get('hero-announcement').textContent, undefined);
  b.get('hero-autoplay').fire('click'); assert.equal(b.timers.size, 0);
  b.get('hero-next').fire('click'); assert.equal(b.timers.size, 0);
  b.get('hero-autoplay').fire('click'); assert.equal(b.timers.size, 1);
});
test('hover, focus and hidden documents pause the timer and resume with a full interval', () => {
  const b = boot(), root = b.get('hero-carousel');
  root.fire('mouseenter'); assert.equal(b.timers.size, 0); root.fire('mouseleave'); assert.equal(b.timers.size, 1);
  root.fire('focusin'); assert.equal(b.timers.size, 0);
  root.fire('focusout', { relatedTarget: { inside: true } }); assert.equal(b.timers.size, 0);
  root.fire('focusout', { relatedTarget: null }); assert.equal(b.timers.size, 1);
  b.document.hidden = true; b.document.fire('visibilitychange'); assert.equal(b.timers.size, 0);
  b.document.hidden = false; b.document.fire('visibilitychange'); assert.equal(b.timers.size, 1);
});
test('reduced motion disables autoplay but permits manual navigation and an explicit restart', () => {
  const b = boot(true); assert.equal(b.timers.size, 0);
  assert.equal(b.get('hero-autoplay').attributes['aria-pressed'], 'false');
  b.get('hero-stage').fire('keydown', { key: 'ArrowRight' });
  assert.equal(b.get('hero-position').textContent, '02 / 09'); assert.equal(b.timers.size, 0);
  b.get('hero-autoplay').fire('click'); assert.equal(b.timers.size, 1);
  b.media.fire('change'); assert.equal(b.timers.size, 0);
});
test('swipes navigate and suppress link activation, while taps, vertical motion and cancellation do not', () => {
  const b = boot(), stage = b.get('hero-stage');
  stage.fire('pointerdown'); assert.equal(stage.capture, null);
  stage.fire('pointermove', { clientX: -90 }); assert.equal(stage.capture, 1);
  stage.fire('pointerup', { clientX: -90 });
  assert.equal(b.get('hero-position').textContent, '02 / 09'); assert.equal(stage.fire('click').prevented, true);
  stage.fire('pointerdown'); stage.fire('pointerup'); assert.equal(stage.fire('click').prevented, undefined);
  stage.fire('pointerdown'); stage.fire('pointerup', { clientY: 100 }); assert.equal(b.get('hero-position').textContent, '02 / 09');
  stage.fire('pointerdown'); stage.fire('pointercancel'); stage.fire('pointerup', { clientX: -90 }); assert.equal(b.get('hero-position').textContent, '02 / 09');
  assert.equal(b.M.state().balance, 0); assert.equal(b.M.state().history.length, 0);
});
