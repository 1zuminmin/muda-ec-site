const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
function boot() {
  const nodes = new Map(), events = {}, map = new Map(), window = new EventTarget();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { innerHTML: '', addEventListener() {}, querySelector: () => node('close'), showModal() {}, close() {} });
    return nodes.get(id);
  };
  const context = vm.createContext({ window, CustomEvent, Date, structuredClone, crypto: require('node:crypto').webcrypto,
    document: { getElementById: node, addEventListener: (t, fn) => { events[t] = fn; }, body: { classList: { add() {}, remove() {} } } },
    localStorage: { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
  });
  vm.runInContext(read('js/storage.js'), context);
  return { m: window.Muda, context, node, events, map, window };
}
test('honors show a denominator of eight with the secret card fifth before and after completion', () => {
  const b = boot();
  vm.runInContext(read('js/achievements.js'), b.context);
  assert.equal(b.node('overall-progress').max, 8);
  let cards = b.node('achievements-list').innerHTML.split('<article').slice(1);
  assert.equal(cards.length, 9);
  assert.match(cards[4], /まだ見ぬ無駄/);
  const s = b.m.state();
  s.history = b.m.products.map((p, i) => ({ id: `TEST-${i}`, productId: p.id, price: p.price, date: s.lastUsed }));
  s.totalSpent = 171000; s.earnedTotal = 100;
  s.unlocked = b.m.achievements.map(a => a.id);
  s.completion = { date: s.lastUsed, totalSpent: 171000, count: 10 };
  b.map.set('muda-shokai:v1', JSON.stringify(s));
  b.window.dispatchEvent(new Event('muda:update'));
  assert.equal(b.node('unlocked-count').textContent, 8);
  assert.equal(b.node('overall-percent').textContent, '100%');
  cards = b.node('achievements-list').innerHTML.split('<article').slice(1);
  assert.match(cards[4], /真の無駄使いyer/);
  assert.match(cards[4], /解除済み/);
});
test('membership UI shows dues, disables insufficient confirmation and quotes upgrade differences', () => {
  const b = boot(); b.m.badgeHTML = () => ''; b.m.toast = () => {};
  vm.runInContext(read('js/membership.js'), b.context);
  assert.match(b.node('plans').innerHTML, /¥2,000/);
  assert.match(b.node('plans').innerHTML, /¥5,000/);
  assert.match(b.node('plans').innerHTML, /¥10,000/);
  const click = id => b.events.click({ target: { closest: selector => selector === '[data-join]' ? { dataset: { join: id } } : null } });
  click('ordinary');
  assert.match(b.node('member-dialog-content').innerHTML, /id="confirm-membership" disabled/);
  assert.match(b.node('member-dialog-content').innerHTML, /資金不足/);
  const s = b.m.state(); s.balance = 10000; b.map.set('muda-shokai:v1', JSON.stringify(s));
  b.m.join('ordinary'); click('gold');
  assert.match(b.node('member-dialog-content').innerHTML, /今回の架空会費：¥3,000/);
  b.node('confirm-membership').onclick();
  assert.equal(b.m.state().balance, 5000);
  assert.equal(b.m.memberPlan().id, 'gold');
});
