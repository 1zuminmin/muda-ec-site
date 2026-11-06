const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
function boot(records, complete = false) {
  class Element {
    constructor() { this.children = []; this.attributes = {}; }
    append(...children) { this.children.push(...children); }
    setAttribute(key, value) { this.attributes[key] = value; }
  }
  const nodes = new Map([...read('honor-roll.html').matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const document = { getElementById(id) { assert.ok(nodes.has(id), id); return nodes.get(id); }, createElement: () => new Element() };
  const window = new EventTarget(), map = new Map();
  const context = vm.createContext({ window, document, Date, CustomEvent, structuredClone,
    localStorage: { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
  });
  vm.runInContext(read('js/storage.js'), context);
  vm.runInContext(read('js/honor-roll-data.js'), context);
  if (records) window.IminaiHonorRoll = records;
  const M = window.Muda;
  if (complete) {
    const s = M.state(); s.profile.name = '徒労 太郎';
    s.history = M.products.map((p, i) => ({ id: `TEST-${i}`, productId: p.id, price: p.price, date: s.lastUsed }));
    s.totalSpent = 171000; s.completion = { date: s.lastUsed, totalSpent: 171000, count: 10 };
    map.set('muda-shokai:v1', JSON.stringify(s));
  }
  vm.runInContext(read('js/honor-roll.js'), context);
  return { M, nodes, window };
}
test('the real public roster is empty and never automatically publishes the local completion name', () => {
  const b = boot(null, true);
  assert.equal(b.nodes.get('honor-roll-count').textContent, 0);
  assert.equal(b.nodes.get('honor-roll-empty').hidden, false);
  assert.equal(b.nodes.get('honor-roll-list').children.length, 0);
  assert.equal(b.nodes.get('honor-roll-local').hidden, false);
  assert.equal(b.nodes.get('honor-roll-local-name').textContent, '徒労 太郎 様');
  b.M.setName('無益 花子');
  assert.equal(b.nodes.get('honor-roll-local-name').textContent, '無益 花子 様');
  assert.equal(b.window.IminaiHonorRoll.length, 0);
  b.M.clear(); assert.equal(b.nodes.get('honor-roll-local').hidden, true);
});
test('curated entries use literal text, actual counts and valid calendar dates', () => {
  const b = boot([
    { name: '<b>浪費家</b>', completedOn: '2026-11-06' },
    { name: '名誉の徒労', completedOn: '2026-11-07' },
    { name: 'invalid date', completedOn: '2026-02-30' },
    { name: '', completedOn: '2026-11-06' }
  ]);
  assert.equal(b.nodes.get('honor-roll-count').textContent, 2);
  assert.equal(b.nodes.get('honor-roll-empty').hidden, true);
  const entries = b.nodes.get('honor-roll-list').children;
  assert.equal(entries[0].children[1].textContent, '<b>浪費家</b> 様');
  assert.equal(entries[0].children[1].innerHTML, undefined);
  assert.equal(entries[0].children[2].dateTime, '2026-11-06');
  assert.equal(b.nodes.get('honor-roll-local').hidden, true);
});
