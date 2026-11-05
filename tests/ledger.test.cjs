/* Optional development checks: node --test tests/*.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/storage.js'), 'utf8');
const KEY = 'muda-shokai:v1';
function boot({ map = new Map(), blocked = false, now = Date.now() } = {}) {
  let clock = now;
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } }
  const window = new EventTarget();
  vm.runInContext(source, vm.createContext({ window, CustomEvent, structuredClone, crypto: require('node:crypto').webcrypto, Date: Clock, localStorage: {
    getItem(k) { if (blocked) throw Error('denied'); return map.get(k) ?? null; },
    setItem(k, v) { if (blocked) throw Error('quota'); map.set(k, v); },
    removeItem(k) { if (blocked) throw Error('denied'); map.delete(k); }
  } }));
  return { m: window.Muda, map, advance(ms = 200) { clock += ms; } };
}
function legacy(version = 1) {
  const s = { version, balance: 8600, totalSpent: 1400, history: ['stone', 'dot', 'void'].map((productId, i) => ({ productId, price: [100, 300, 1000][i], id: `MS-OLD-${i}`, date: '2026-11-01T00:00:00.000Z' })), unlocked: ['first', 'planned', 'return', 'collection'], lastUsed: '2026-11-01T00:00:00.000Z' };
  if (version === 2) Object.assign(s, { workCount: 2, earnedTotal: 20, workLastAt: 0, membership: null, rounds: [], pendingRound: null, completion: null });
  return s;
}
function cycle(b) { const seal = b.m.workStep('seal'); b.advance(); const peel = b.m.workStep('peel'); b.advance(); return { seal, peel }; }
function earn(b, amount) { while (b.m.state().balance < amount) cycle(b); }
function collectRegular(b) { b.m.join('black'); let last; for (const p of b.m.regularProducts) { earn(b, p.price); last = b.m.buy(p.id); } return last; }
test('new game starts at zero, with nine visible products and no gambling API', () => {
  const { m } = boot(); assert.equal(m.state().balance, 0); assert.equal(m.state().version, 3); assert.equal(m.visibleProducts().length, 9); assert.equal(m.specialUnlocked(), false); assert.equal(m.startRound, undefined); assert.equal(m.settleRound, undefined);
});
test('sealing pays nothing; peeling restores the envelope and pays once', () => {
  const b = boot(), { m } = b; const seal = m.workStep('seal');
  assert.equal(seal.amount, 0); assert.equal(m.state().balance, 0); assert.equal(m.state().workPhase, 'peel'); assert.equal(m.state().workCount, 0);
  b.advance(); const peel = m.workStep('peel'); assert.equal(peel.amount, 10); assert.equal(m.state().balance, 10); assert.equal(m.state().workPhase, 'seal'); assert.equal(m.state().workCount, 1);
  assert.throws(() => m.workStep('peel')); assert.equal(m.state().balance, 10);
});
test('rapid input and wrong order cannot skip a stage or double-pay', () => {
  const { m, advance } = boot(); assert.throws(() => m.workStep('peel')); assert.throws(() => m.workStep('invalid')); m.workStep('seal');
  assert.equal(m.workStep('peel'), null); assert.equal(m.state().balance, 0); advance(); m.workStep('peel'); assert.equal(m.workStep('seal'), null); assert.equal(m.state().balance, 10);
});
test('in-progress work survives reload without paying or resealing', () => {
  const { m, map, advance } = boot(); m.workStep('seal'); advance();
  const next = boot({ map, now: Date.now() + 1000 }).m; assert.equal(next.state().workPhase, 'peel'); assert.equal(next.state().balance, 0); assert.throws(() => next.workStep('seal')); next.workStep('peel'); assert.equal(next.state().balance, 10);
});
test('all membership ranks raise the round-trip rate and remain free', () => {
  const b = boot(), { m } = b; let expected = 0;
  for (const [planId, rate] of [['ordinary', 20], ['gold', 50], ['black', 100]]) {
    const before = m.state().balance; m.join(planId); assert.equal(m.state().balance, before); assert.equal(m.workRate(), rate); assert.equal(cycle(b).peel.amount, rate); expected += rate;
  }
  assert.equal(m.state().earnedTotal, expected); assert.equal(m.state().totalSpent, 0); m.leave(); assert.equal(m.workRate(), 10); assert.equal(cycle(b).peel.amount, 10);
});
test('the plan at completion controls payment even if changed mid-envelope', () => {
  const b = boot(), { m } = b; m.workStep('seal'); m.join('black'); b.advance(); assert.equal(m.workStep('peel').amount, 100);
  b.advance(); m.workStep('seal'); m.leave(); b.advance(); assert.equal(m.workStep('peel').amount, 10);
});
test('worker honor unlocks once and purchases keep earned totals separate', () => {
  const b = boot(); b.m.join('black'); const r = cycle(b); assert.deepEqual(Array.from(r.peel.newly, a => a.id), ['worker']); assert.equal(cycle(b).peel.newly.length, 0); b.m.buy('stone');
  assert.equal(b.m.state().totalSpent, 100); assert.equal(b.m.state().earnedTotal, 200); assert.equal(b.m.state().balance, 100);
});
test('hidden product cannot be viewed or bought before all nine ordinary products', () => {
  const b = boot(); b.m.join('black'); earn(b, 20000); const before = JSON.stringify(b.m.state());
  assert.equal(b.m.canView('final-envelope'), false); assert.throws(() => b.m.buy('final-envelope'), /ご案内/); assert.equal(JSON.stringify(b.m.state()), before);
  b.m.buy('stone'); assert.equal(b.m.specialUnlocked(), false);
});
test('repeated copies do not count as different regular products', () => {
  const b = boot(); b.m.join('black'); earn(b, 1000); for (let i = 0; i < 9; i++) b.m.buy('stone');
  assert.equal(b.m.regularCount(), 1); assert.equal(b.m.visibleProducts().length, 9); assert.equal(b.m.state().completion, null);
});
test('ninth distinct product unlocks the invitation once but does not complete game', () => {
  const b = boot(), last = collectRegular(b);
  assert.equal(last.invitationNow, true); assert.equal(last.completedNow, false); assert.equal(b.m.state().completion, null); assert.equal(b.m.state().standardCompletion.totalSpent, 14200); assert.equal(b.m.visibleProducts().length, 10); assert.equal(b.m.canView('final-envelope'), true);
  earn(b, 100); assert.equal(b.m.buy('stone').invitationNow, false);
});
test('secret costs 20,000 and completes only after an affordable purchase', () => {
  const b = boot(); collectRegular(b); assert.throws(() => b.m.buy('final-envelope'), /不足/); assert.equal(b.m.state().completion, null);
  earn(b, 20000); const r = b.m.buy('final-envelope'); assert.equal(r.purchase.price, 20000); assert.equal(r.completedNow, true); assert.equal(b.m.state().completion.totalSpent, 34200); assert.equal(b.m.state().completion.count, 10); assert.equal(b.m.state().unlocked.includes('complete'), true); assert.equal(b.m.state().completion.number, undefined);
});
test('complete snapshot persists across reload and does not issue twice', () => {
  const b = boot(); collectRegular(b); earn(b, 20000); b.m.buy('final-envelope'); const completed = JSON.stringify(b.m.state().completion);
  earn(b, 20000); assert.equal(b.m.buy('final-envelope').completedNow, false); assert.equal(JSON.stringify(boot({ map: b.map }).m.state().completion), completed);
});
test('v1 migration preserves the user balance and original purchase records', () => {
  const map = new Map([[KEY, JSON.stringify(legacy())]]), { m } = boot({ map });
  assert.equal(m.state().version, 3); assert.equal(m.state().balance, 8600); assert.equal(m.state().totalSpent, 1400); assert.equal(m.state().history.length, 3); assert.equal(m.corrupt, false);
});
test('v2 keeps earnings and membership, retires old rounds and settles pending win once', () => {
  const s = legacy(2); s.membership = { planId: 'gold', since: s.lastUsed }; s.pendingRound = { stake: 500, die1: 1, die2: 1, choice: 'cho', won: true };
  const map = new Map([[KEY, JSON.stringify(s)]]), { m } = boot({ map });
  assert.equal(m.state().balance, 9600); assert.equal(m.state().earnedTotal, 20); assert.equal(m.workRate(), 50); assert.equal(m.state().rounds, undefined); assert.equal(m.state().pendingRound, undefined); assert.equal(boot({ map }).m.state().balance, 9600);
});
test('old nine-product completion becomes a preserved ordinary collection milestone', () => {
  const { m } = boot(), s = legacy(2); s.history = m.regularProducts.map((p, i) => ({ id: `OLD-${i}`, productId: p.id, price: p.price, date: s.lastUsed })); s.totalSpent = 14200; s.unlocked.push('complete'); s.completion = { date: s.lastUsed, totalSpent: 14200, count: 9 };
  const b = boot({ map: new Map([[KEY, JSON.stringify(s)]]) }); assert.equal(b.m.state().completion, null); assert.equal(b.m.state().standardCompletion.date, s.lastUsed); assert.equal(b.m.specialUnlocked(), true); assert.equal(b.m.state().unlocked.includes('complete'), false); assert.equal(b.m.state().unlocked.includes('regular'), true);
});
test('zeroing funds preserves history, earnings, membership and work phase', () => {
  const b = boot(); b.m.join('black'); earn(b, 200); b.m.buy('stone'); b.m.workStep('seal'); b.m.resetBalance();
  assert.equal(b.m.state().balance, 0); assert.equal(b.m.state().earnedTotal, 200); assert.equal(b.m.state().totalSpent, 100); assert.equal(b.m.state().membership.planId, 'black'); assert.equal(b.m.state().workPhase, 'peel');
});
test('full reset returns to the zero-yen beginning and locks the invitation', () => {
  const b = boot(); collectRegular(b); b.m.clear(); const s = boot({ map: b.map }).m.state(); assert.equal(s.balance, 0); assert.equal(s.history.length, 0); assert.equal(s.earnedTotal, 0); assert.equal(s.membership, null); assert.equal(s.standardCompletion, null); assert.equal(s.completion, null); assert.equal(s.workPhase, 'seal');
});
test('blocked storage still supports temporary round trips and purchases', () => {
  const b = boot({ blocked: true }); b.m.join('black'); cycle(b); b.m.buy('stone'); assert.equal(b.m.persistent, false); assert.equal(b.m.state().balance, 0); assert.equal(b.m.state().history.length, 1);
});
test('corrupt saved data is untouched until explicitly cleared', () => {
  const map = new Map([[KEY, '{broken']]), b = boot({ map }); cycle(b); assert.equal(map.get(KEY), '{broken'); assert.equal(b.m.corrupt, true); b.m.clear(); assert.equal(boot({ map }).m.state().balance, 0);
});
test('a second tab cannot complete an already peeled envelope again', () => {
  const b = boot(); b.m.workStep('seal'); b.advance(); const other = boot({ map: b.map, now: Date.now() + 1000 }).m; other.workStep('peel'); assert.throws(() => b.m.workStep('peel')); assert.equal(b.m.state().balance, 10);
});
