/* Optional development checks: node --test tests/ledger.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/storage.js'), 'utf8');
const KEY = 'muda-shokai:v1';
function boot({ map = new Map(), blocked = false, random = null, now = Date.now() } = {}) {
  let clock = now;
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } }
  const window = new EventTarget();
  const crypto = random ? { getRandomValues(array) { array[0] = random.shift() ?? 1; return array; } } : webcrypto;
  vm.runInContext(source, vm.createContext({ window, CustomEvent, structuredClone, crypto, Date: Clock, localStorage: {
    getItem(k) { if (blocked) throw Error('denied'); return map.get(k) ?? null; },
    setItem(k, v) { if (blocked) throw Error('quota'); map.set(k, v); },
    removeItem(k) { if (blocked) throw Error('denied'); map.delete(k); }
  } }));
  return { m: window.Muda, map, advance(ms = 200) { clock += ms; } };
}
function legacy() {
  return { version: 1, balance: 8600, totalSpent: 1400, history: ['stone', 'dot', 'void'].map((productId, i) => ({ productId, price: [100, 300, 1000][i], id: `MS-OLD-${i}`, date: '2026-11-01T00:00:00.000Z' })), unlocked: ['first', 'planned', 'return', 'collection'], lastUsed: '2026-11-01T00:00:00.000Z' };
}
test('new ledger has 9 products, 8 honors, free memberships and 10,000 yen', () => {
  const { m } = boot(); assert.equal(m.products.length, 9); assert.equal(m.achievements.length, 8); assert.equal(m.plans.length, 3); assert.equal(m.state().balance, 10000); assert.equal(m.state().membership, null);
});
test('v1 migration keeps original money, purchases and achievements', () => {
  const map = new Map([[KEY, JSON.stringify(legacy())]]), { m } = boot({ map });
  assert.equal(m.state().version, 2); assert.equal(m.state().balance, 8600); assert.equal(m.state().totalSpent, 1400); assert.equal(m.state().history.length, 3); assert.equal(m.state().unlocked.length, 4); assert.equal(m.state().earnedTotal, 0); assert.equal(m.corrupt, false);
});
test('work adds money, throttles rapid clicks, and keeps spending separate', () => {
  const { m, advance } = boot(); assert.equal(m.work().amount, 10); assert.equal(m.work(), null); advance(); m.work();
  assert.equal(m.state().balance, 10020); assert.equal(m.state().earnedTotal, 20); assert.equal(m.state().workCount, 2); assert.equal(m.state().totalSpent, 0);
});
test('work honor unlocks once after 100 earned yen', () => {
  const { m, advance } = boot(); let unlocked = [];
  for (let i = 0; i < 12; i++) { unlocked.push(...m.work().newly.map(a => a.id)); advance(); }
  assert.deepEqual(unlocked, ['worker']);
});
test('winning cho pays exactly twice the stake after stake deduction', () => {
  const { m } = boot({ random: [0, 0] }); const r = m.startRound(500, 'cho');
  assert.equal(r.die1, 1); assert.equal(r.die2, 1); assert.equal(r.won, true); assert.equal(m.state().balance, 9500);
  assert.equal(m.settleRound().won, true); assert.equal(m.state().balance, 10500); assert.equal(m.state().totalSpent, 0); assert.equal(m.state().earnedTotal, 0);
});
test('losing cho returns no stake, winning han supports odd sums', () => {
  const { m } = boot({ random: [0, 1, 9, 0, 1] }); m.startRound(100, 'cho'); m.settleRound(); assert.equal(m.state().balance, 9900);
  m.startRound(100, 'han'); m.settleRound(); assert.equal(m.state().balance, 10000);
});
test('pending results survive reload and cannot be rerolled or paid twice', () => {
  const { m, map } = boot({ random: [0, 0] }); const r = m.startRound(5000, 'cho'); assert.throws(() => m.startRound(100, 'cho'), /前の勝負/);
  const next = boot({ map }).m; assert.equal(next.state().pendingRound.id, r.id); next.settleRound(); assert.equal(next.state().balance, 15000); assert.equal(next.settleRound(), null); assert.equal(next.state().rounds.length, 1);
});
test('invalid bets and choices do not mutate ledger', () => {
  const { m } = boot(); const before = JSON.stringify(m.state());
  for (const n of [0, -100, 50, 101, 5100, NaN, Infinity]) assert.throws(() => m.startRound(n, 'cho'));
  assert.throws(() => m.startRound(100, 'invalid')); assert.equal(JSON.stringify(m.state()), before);
});
test('insufficient money cannot be bet or spent', () => {
  const { m } = boot({ random: [0, 1, 9, 0, 1] }); m.startRound(5000, 'cho'); m.settleRound(); m.startRound(5000, 'cho'); m.settleRound();
  assert.equal(m.state().balance, 0); assert.throws(() => m.startRound(100, 'cho'), /足りません/); assert.throws(() => m.buy('stone'), /不足/);
});
test('dice faces discard out-of-range random values instead of modulo bias', () => {
  const { m } = boot({ random: [4294967295, 5, 4] }); const r = m.startRound(100, 'han'); assert.equal(r.die1, 6); assert.equal(r.die2, 5); assert.equal(r.won, true);
});
test('only the 30 most recent dice rounds are retained', () => {
  const { m } = boot(); for (let i = 0; i < 35; i++) { m.startRound(100, 'cho'); m.settleRound(); } assert.equal(m.state().rounds.length, 30);
});
test('membership join, switch and leave cost nothing and change no rewards', () => {
  const { m, advance } = boot(); m.join('gold'); const since = m.state().membership.since; advance(5000); m.join('black');
  assert.equal(m.state().membership.since, since); assert.equal(m.state().balance, 10000); assert.equal(m.work().amount, 10); m.leave(); assert.equal(m.state().membership, null); assert.throws(() => m.join('invalid'));
});
test('buying all unique products creates one persistent numberless completion', () => {
  const { m, map } = boot(); let completed = 0;
  for (const p of m.products) { if (m.state().balance < p.price) m.resetBalance(); completed += Number(m.buy(p.id).completedNow); }
  assert.equal(completed, 1); assert.equal(m.state().completion.totalSpent, 14200); assert.equal(m.state().unlocked.includes('complete'), true); assert.equal(m.state().completion.number, undefined);
  const date = m.state().completion.date; m.resetBalance(); assert.equal(m.buy('stone').completedNow, false); assert.equal(m.state().completion.date, date); assert.equal(boot({ map }).m.state().completion.date, date);
});
test('repeated copies of one product do not complete collection', () => {
  const { m } = boot(); for (let i = 0; i < 9; i++) m.buy('stone'); assert.equal(m.state().completion, null); assert.equal(m.state().unlocked.includes('complete'), false);
});
test('reset preserves earned, purchased, membership and honors', () => {
  const { m } = boot(); m.work(); m.buy('stone'); m.join('gold'); m.resetBalance(); assert.equal(m.state().balance, 10000); assert.equal(m.state().totalSpent, 100); assert.equal(m.state().earnedTotal, 10); assert.equal(m.state().membership.planId, 'gold'); assert.equal(m.state().history.length, 1);
});
test('clear deletes all game and membership records', () => {
  const { m, map } = boot(); m.work(); m.buy('stone'); m.join('black'); m.startRound(100, 'cho'); m.clear();
  const s = boot({ map }).m.state(); assert.equal(s.totalSpent, 0); assert.equal(s.earnedTotal, 0); assert.equal(s.history.length, 0); assert.equal(s.rounds.length, 0); assert.equal(s.pendingRound, null); assert.equal(s.membership, null); assert.equal(s.completion, null); assert.equal(s.balance, 10000);
});
test('corrupt records remain untouched until explicit clear', () => {
  const map = new Map([[KEY, '{broken']]), { m } = boot({ map }); assert.equal(m.corrupt, true); m.work(); m.join('gold'); assert.equal(map.get(KEY), '{broken'); m.clear(); assert.equal(boot({ map }).m.corrupt, false);
});
test('blocked storage remains usable temporarily', () => {
  const { m } = boot({ blocked: true }); m.work(); m.buy('stone'); m.join('gold'); assert.equal(m.persistent, false); assert.equal(m.state().balance, 9910); assert.equal(m.state().membership.planId, 'gold');
});
test('a second tab reads the latest balance before spending', () => {
  const { m: a, map } = boot(), b = boot({ map }).m; a.work(); b.buy('dot'); assert.equal(a.state().balance, 9710); assert.equal(a.state().history.length, 1);
});
test('damaged v2 earnings are rejected without overwriting', () => {
  const { map } = boot(), s = JSON.parse(map.get(KEY)); s.earnedTotal = 1000; map.set(KEY, JSON.stringify(s)); assert.equal(boot({ map }).m.corrupt, true); assert.equal(JSON.parse(map.get(KEY)).earnedTotal, 1000);
});
