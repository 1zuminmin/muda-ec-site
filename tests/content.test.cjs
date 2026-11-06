const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const map = new Map(), window = new EventTarget();
const context = vm.createContext({ window, CustomEvent, structuredClone, crypto: require('node:crypto').webcrypto, Date, localStorage: { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) } });
vm.runInContext(read('js/storage.js'), context);
vm.runInContext(read('js/reviews.js'), context);
const M = window.Muda;
for (const page of pages) {
  test(`${page}: local links, scripts, anchors and shared page structure`, () => {
    const html = read(page);
    assert.match(html, /<html lang="ja">/); assert.match(html, /name="viewport"/); assert.match(html, /伊見内商会/);
    assert.match(html, /id="site-header"/); assert.match(html, /id="site-footer"/); assert.match(html, /id="toast-region"/);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]); assert.equal(ids.length, new Set(ids).size, 'duplicate id');
    for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (ref.startsWith('#')) { assert.ok(ids.includes(ref.slice(1)), `missing ${ref}`); continue; }
      if (/^[a-z]+:/i.test(ref)) continue;
      assert.ok(fs.existsSync(path.join(root, ref.split(/[?#]/)[0])), `missing ${ref}`);
    }
    const scripts = [...html.matchAll(/<script defer src="([^"]+)"/g)].map(m => m[1]);
    assert.equal(scripts[0], 'js/storage.js'); assert.equal(scripts[1], 'js/config.js'); assert.equal(scripts[2], 'js/main.js');
    if (scripts.includes('js/shop.js')) { assert.ok(scripts.indexOf('js/certificate.js') < scripts.indexOf('js/shop.js')); assert.ok(ids.includes('purchase-dialog')); }
  });
}
test('every product has two complete fictional reviews and an existing image', () => {
  for (const p of M.products) {
    assert.ok(fs.existsSync(path.join(root, 'assets/images', p.image)), p.image);
    const reviews = M.reviews[p.id]; assert.equal(reviews.length, 2);
    for (const r of reviews) { assert.ok(r.name && r.title && r.body); assert.ok(Number.isInteger(r.stars) && r.stars >= 1 && r.stars <= 5); }
  }
  assert.equal(Object.keys(M.reviews).length, M.products.length);
});
