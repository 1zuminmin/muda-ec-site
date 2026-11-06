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
test('honors start out of eight, expand at eight and retain the secret card in the center', () => {
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
  assert.equal(b.node('unlocked-count').textContent, 9);
  assert.equal(b.node('overall-progress').max, 9);
  assert.equal(b.node('overall-percent').textContent, '100%');
  cards = b.node('achievements-list').innerHTML.split('<article').slice(1);
  assert.match(cards[4], /真の無駄使いyer/);
  assert.match(cards[4], /解除済み/);
});
test('collection and honor denominators expand independently and repeated purchases do not advance the target', () => {
  const b = boot(), s = b.m.state();
  const purchase = (p, i) => ({ id: `TEST-${i}`, productId: p.id, price: p.price, date: s.lastUsed });
  for (const [count, total] of [[0, 8], [1, 8], [7, 8], [8, 9], [9, 10], [10, 10]]) {
    s.history = b.m.products.slice(0, count).map(purchase);
    assert.equal(b.m.collectionProgress(s).count, count);
    assert.equal(b.m.collectionProgress(s).total, total);
  }
  s.history = Array.from({ length: 8 }, (_, i) => purchase(b.m.products[0], i));
  assert.equal(b.m.collectionProgress(s).count, 1);
  assert.equal(b.m.collectionProgress(s).total, 8);
  s.unlocked = b.m.regularAchievements.slice(0, 7).map(a => a.id);
  assert.equal(b.m.honorProgress(s).total, 8);
  s.unlocked = b.m.regularAchievements.map(a => a.id);
  assert.equal(b.m.honorProgress(s).count, 8);
  assert.equal(b.m.honorProgress(s).total, 9);
  assert.equal(b.m.collectionProgress(s).total, 8);
});
test('membership UI shows dues, disables insufficient confirmation and quotes upgrade differences', () => {
  const b = boot(); b.m.badgeHTML = () => ''; b.m.toast = () => {};
  vm.runInContext(read('js/membership.js'), b.context);
  const buttonClass = id => b.node('plans').innerHTML.match(new RegExp(`<button class="([^"]+)" data-join="${id}"`))[1];
  for (const id of ['ordinary', 'gold', 'black']) assert.match(buttonClass(id), /membership-locked/);
  assert.match(b.node('plans').innerHTML, /¥2,000/);
  assert.match(b.node('plans').innerHTML, /¥5,000/);
  assert.match(b.node('plans').innerHTML, /¥10,000/);
  const click = id => b.events.click({ target: { closest: selector => selector === '[data-join]' ? { dataset: { join: id } } : null } });
  click('ordinary');
  assert.match(b.node('member-dialog-content').innerHTML, /id="confirm-membership" disabled/);
  assert.match(b.node('member-dialog-content').innerHTML, /資金不足/);
  assert.match(b.node('member-dialog-content').innerHTML, /class="button membership-locked full" id="confirm-membership"/);
  const s = b.m.state(); s.balance = 12000; b.map.set('muda-shokai:v1', JSON.stringify(s));
  click('black');
  assert.match(b.node('member-dialog-content').innerHTML, /あと3種類の購入が必要/);
  assert.match(b.node('member-dialog-content').innerHTML, /id="confirm-membership" disabled/);
  assert.match(b.node('member-dialog-content').innerHTML, /href="shop.html"/);
  b.m.buy('stone');
  assert.match(buttonClass('ordinary'), /\bgold\b/);
  assert.match(buttonClass('gold'), /membership-locked/);
  b.m.join('ordinary'); click('gold');
  assert.match(buttonClass('ordinary'), /membership-locked/);
  assert.match(b.node('member-dialog-content').innerHTML, /あと1種類の購入が必要/);
  assert.match(b.node('member-dialog-content').innerHTML, /id="confirm-membership" disabled/);
  b.m.buy('dot'); click('gold');
  assert.match(buttonClass('gold'), /\bgold\b/);
  assert.doesNotMatch(b.node('member-dialog-content').innerHTML, /id="confirm-membership" disabled/);
  assert.match(b.node('member-dialog-content').innerHTML, /class="button gold full" id="confirm-membership"/);
  assert.match(b.node('member-dialog-content').innerHTML, /今回の架空会費：¥3,000/);
  b.node('confirm-membership').onclick();
  assert.equal(b.m.state().balance, 5000);
  assert.equal(b.m.memberPlan().id, 'gold');
});
