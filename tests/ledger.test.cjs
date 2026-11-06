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
function collectRegular(b) { fund(b, 300000); let last; for (const p of b.m.regularProducts) { earn(b, p.price); last = b.m.buy(p.id); } return last; }

function fund(b, balance) { const s = b.m.state(); s.balance = balance; b.map.set(KEY, JSON.stringify(s)); }
test('new game starts at zero with eight regular honors and nine visible products', () => {
 const {m}=boot(); assert.equal(m.state().version,6); assert.equal(m.state().balance,0); assert.equal(m.regularAchievements.length,8); assert.equal(m.visibleProducts().length,9); assert.equal(m.startRound,undefined);
});
test('all ten prices are five times the historical prices',()=>{const {m}=boot(); for(const p of m.products) assert.equal(p.price,p.legacyPrice*5); assert.equal(m.products.reduce((n,p)=>n+p.price,0),171000);});
test('work requires seal then peel, survives reload and pays once',()=>{const b=boot(); assert.throws(()=>b.m.workStep('peel')); b.m.workStep('seal');assert.equal(b.m.workStep('peel'),null);b.advance();const next=boot({map:b.map,now:Date.now()+1000}).m;assert.equal(next.workStep('peel').amount,10);assert.throws(()=>b.m.workStep('peel'));assert.equal(b.m.state().balance,10);});
test('insufficient funds and stale membership quotes cannot charge or change plans',()=>{const b=boot();assert.throws(()=>b.m.join('ordinary'),/不足/);fund(b,10000);assert.throws(()=>b.m.join('gold',0),/変わり/);assert.equal(b.m.state().balance,10000);assert.equal(b.m.state().membership,null);});
test('dues charge once, upgrades charge differences, downgrade and rejoin never refund or recharge',()=>{const b=boot();own(b);fund(b,10000);for(const [id,cost,rate] of [['ordinary',2000,20],['gold',3000,50],['black',5000,100]]){assert.equal(b.m.joinQuote(id).cost,cost);b.m.join(id,cost);assert.equal(b.m.workRate(),rate);}assert.equal(b.m.state().balance,0);assert.equal(b.m.state().membershipSpent,10000);assert.equal(b.m.state().totalSpent,7000);b.m.join('ordinary');b.m.leave();b.m.join('black');assert.equal(b.m.state().balance,0);assert.equal(b.m.state().membershipSpent,10000);assert.equal(boot({map:b.map}).m.workRate(),100);});
test('membership at peeling controls pay and keeps income separate',()=>{const b=boot();own(b);fund(b,10000);b.m.workStep('seal');b.m.join('black');b.advance();assert.equal(b.m.workStep('peel').amount,100);assert.equal(b.m.state().earnedTotal,100);assert.equal(b.m.state().totalSpent,7000);});
test('new purchases debit new prices; old history and certificates retain original prices',()=>{const b=boot({map:new Map([[KEY,JSON.stringify(legacy())]])});assert.equal(b.m.corrupt,false);assert.equal(b.m.state().totalSpent,1400);assert.equal(b.m.buy('stone').purchase.price,500);assert.equal(b.m.state().balance,8100);assert.equal(b.m.state().totalSpent,1900);assert.equal(b.m.state().history[0].price,100);assert.equal(boot({map:b.map}).m.state().totalSpent,1900);});
test('existing members inherit credit without retroactive charges and upgrade by difference',()=>{const s=legacy(2);s.membership={planId:'gold',since:s.lastUsed};const b=boot({map:new Map([[KEY,JSON.stringify(s)]])});assert.equal(b.m.state().balance,8600);assert.equal(b.m.state().membershipCredit,5000);assert.equal(b.m.state().membershipSpent,0);b.m.join('black');assert.equal(b.m.state().balance,3600);assert.equal(b.m.state().membershipSpent,5000);});
test('v2 pending win retires and settles only once',()=>{const s=legacy(2);s.pendingRound={stake:500,die1:1,die2:1,choice:'cho',won:true};const b=boot({map:new Map([[KEY,JSON.stringify(s)]])});assert.equal(b.m.state().balance,9600);assert.equal(b.m.state().rounds,undefined);assert.equal(boot({map:b.map}).m.state().balance,9600);});
test('hidden item is inaccessible before all nine distinct purchases',()=>{const b=boot();fund(b,300000);assert.throws(()=>b.m.buy('final-envelope'),/ご案内/);for(let i=0;i<9;i++)b.m.buy('stone');assert.equal(b.m.regularCount(),1);assert.equal(b.m.canView('final-envelope'),false);});
test('nine products plus all normal honors unlock the final purchase and preserve completion',()=>{const b=boot();const last=collectRegular(b);assert.equal(last.invitationNow,false);assert.equal(last.completedNow,false);assert.equal(b.m.state().standardCompletion.totalSpent,71000);b.m.resetBalance();assert.throws(()=>b.m.buy('final-envelope'),/ご案内/);memberIncome(b);assert.throws(()=>b.m.buy('final-envelope'),/不足/);fund(b,200000);const r=b.m.buy('final-envelope');assert.equal(r.purchase.price,100000);assert.equal(r.completedNow,true);assert.equal(b.m.state().completion.totalSpent,171000);const snapshot=JSON.stringify(b.m.state().completion);assert.equal(b.m.buy('final-envelope').completedNow,false);assert.equal(JSON.stringify(boot({map:b.map}).m.state().completion),snapshot);assert.equal(b.m.regularHonorCount(),8);});
test('fund reset retains dues credit, history and name; full reset clears all',()=>{const b=boot();own(b);fund(b,15000);b.m.join('black');b.m.buy('stone');b.m.setName('太郎');b.m.resetBalance();assert.equal(b.m.state().totalSpent,7500);assert.equal(b.m.state().membershipCredit,10000);assert.equal(b.m.recipientName(),'太郎');b.m.clear();assert.equal(b.m.state().membershipCredit,0);assert.equal(b.m.state().history.length,0);assert.equal(b.m.state().balance,0);});
test('blocked storage supports temporary work; corrupt data remains untouched',()=>{const b=boot({blocked:true});earn(b,500);b.m.buy('stone');assert.equal(b.m.state().balance,0);assert.equal(b.m.persistent,false);const map=new Map([[KEY,'{broken']]);const c=boot({map});cycle(c);assert.equal(map.get(KEY),'{broken');assert.equal(c.m.corrupt,true);c.m.clear();assert.equal(c.m.state().balance,0);});

test('v4 migration preserves the name and grants only the current membership credit', () => {
  const s = boot().m.state();
  s.version = 4; s.profile.name = '徒労 太郎'; s.balance = 1234;
  s.membership = { planId: 'ordinary', since: s.lastUsed };
  delete s.membershipCredit; delete s.membershipSpent;
  const { m } = boot({ map: new Map([[KEY, JSON.stringify(s)]]) });
  assert.equal(m.corrupt, false);
  assert.equal(m.recipientName(), '徒労 太郎');
  assert.equal(m.state().balance, 1234);
  assert.equal(m.state().membershipCredit, 2000);
  assert.equal(m.joinQuote('gold').cost, 3000);
});
test('old nine-product completion remains a milestone at its original price', () => {
  const s = legacy(2), catalog = boot().m.regularProducts;
  s.history = catalog.map((p, i) => ({ id: `OLD-${i}`, productId: p.id, price: p.legacyPrice, date: s.lastUsed }));
  s.totalSpent = 14200; s.unlocked.push('complete');
  s.completion = { date: s.lastUsed, totalSpent: 14200, count: 9 };
  const { m } = boot({ map: new Map([[KEY, JSON.stringify(s)]]) });
  assert.equal(m.corrupt, false);
  assert.equal(m.state().standardCompletion.totalSpent, 14200);
  assert.equal(m.specialUnlocked(), false);
  assert.equal(m.state().completion, null);
  assert.equal(m.state().unlocked.includes('complete'), false);
});
test('guest work does not count toward paid-member honors and purchasing does not change income', () => {
  const b = boot();
  earn(b, 90);
  assert.equal(cycle(b).peel.newly.length, 0);
  assert.equal(b.m.state().earnedByPlan.ordinary, 0);
  assert.equal(cycle(b).peel.newly.length, 0);
  earn(b, 500); b.m.buy('stone');
  assert.equal(b.m.state().earnedTotal, 500);
  assert.equal(b.m.state().totalSpent, 500);
});
test('unrecognized historical prices are rejected without overwriting the ledger', () => {
  const s = legacy(); s.history[0].price = 101; s.totalSpent = 1401;
  const raw = JSON.stringify(s), map = new Map([[KEY, raw]]);
  const { m } = boot({ map });
  assert.equal(m.corrupt, true);
  assert.equal(map.get(KEY), raw);
});

function own(b, count = 3) {
  const s = b.m.state();
  s.history = b.m.regularProducts.slice(0, count).map((p, i) => ({ id: 'FIXTURE-' + i, productId: p.id, price: p.price, date: s.lastUsed }));
  s.totalSpent = s.history.reduce((sum, p) => sum + p.price, 0);
  b.map.set(KEY, JSON.stringify(s));
}

test('RED GOLD and BLACK require one two and three distinct products plus dues', () => {
  for (const [id, required] of [['ordinary', 1], ['gold', 2], ['black', 3]]) {
    const b = boot(); fund(b, 100000);
    for (let i = 0; i < required - 1; i++) b.m.buy(b.m.regularProducts[i].id);
    const before = JSON.stringify(b.m.state());
    assert.equal(b.m.joinQuote(id).eligible, false);
    assert.throws(() => b.m.join(id), /種類/);
    assert.equal(JSON.stringify(b.m.state()), before);
    b.m.buy(b.m.regularProducts[required - 1].id);
    const q = b.m.joinQuote(id);
    assert.equal(q.required, required); assert.equal(q.purchased, required); assert.equal(q.canJoin, true);
    b.m.join(id, q.cost);
    assert.equal(b.m.state().balance, q.after);
    assert.equal(boot({ map: b.map }).m.memberPlan().id, id);
  }
});
test('repeat copies count once and meeting purchase requirements does not waive dues', () => {
  const b = boot(); fund(b, 100000);
  for (let i = 0; i < 3; i++) b.m.buy('stone');
  assert.equal(b.m.joinQuote('black').purchased, 1);
  assert.throws(() => b.m.join('gold'), /2種類/);
  b.m.resetBalance();
  assert.equal(b.m.joinQuote('ordinary').eligible, true);
  assert.equal(b.m.joinQuote('ordinary').canJoin, false);
  assert.throws(() => b.m.join('ordinary'), /不足/);
});
test('existing membership remains active; rejoining rechecks the purchase requirement', () => {
  const s = boot().m.state(); s.membership = { planId: 'black', since: s.lastUsed }; s.membershipCredit = 10000;
  const b = boot({ map: new Map([[KEY, JSON.stringify(s)]]) });
  assert.equal(b.m.workRate(), 100); assert.equal(b.m.corrupt, false);
  b.m.leave(); assert.throws(() => b.m.join('black'), /3種類/);
  assert.equal(b.m.state().membership, null); assert.equal(b.m.state().membershipCredit, 10000);
});

test('replacement honors at No3 No4 No7 unlock once after 500 paid round trips per rank', () => {
  const definitions = [['ordinary', 'red-worker', 20, 2], ['gold', 'gold-worker', 50, 3], ['black', 'black-worker', 100, 6]];
  for (const [planId, achievementId, rate, position] of definitions) {
    const b = boot(); own(b); fund(b, 10000); b.m.join(planId);
    assert.equal(b.m.achievements[position].id, achievementId);
    assert.equal(b.m.achievements[position].target, rate * 500);
    for (let i = 0; i < 499; i++) cycle(b);
    assert.equal(b.m.state().earnedByPlan[planId], rate * 499);
    assert.equal(b.m.state().unlocked.includes(achievementId), false);
    const result = cycle(b);
    assert.ok(result.peel.newly.some(a => a.id === achievementId));
    assert.equal(b.m.valueFor(b.m.achievements[position], b.m.state()), rate * 500);
    assert.equal(cycle(b).peel.newly.length, 0);
    assert.equal(boot({ map: b.map }).m.state().earnedByPlan[planId], rate * 501);
  }
});

test('only the rank at peeling receives income; guest work, rank changes and fund resets keep separate totals', () => {
  const b = boot(); own(b); fund(b, 20000);
  b.m.join('ordinary'); cycle(b);
  b.m.workStep('seal'); b.m.join('gold'); b.advance(); b.m.workStep('peel'); b.advance();
  b.m.join('black'); cycle(b); b.m.leave(); cycle(b);
  assert.equal(b.m.state().earnedByPlan.ordinary, 20);
  assert.equal(b.m.state().earnedByPlan.gold, 50);
  assert.equal(b.m.state().earnedByPlan.black, 100);
  assert.equal(b.m.state().earnedTotal, 180);
  b.m.resetBalance(); assert.equal(b.m.state().earnedByPlan.black, 100);
  b.m.clear(); assert.equal(b.m.state().earnedByPlan.black, 0);
});

test('v5 migration retires old honors without inventing rank income or changing money and membership', () => {
  const b = boot(); own(b); const s = b.m.state();
  s.version = 5; delete s.earnedByPlan;
  s.balance = 4321; s.earnedTotal = 200000;
  s.membership = { planId: 'gold', since: s.lastUsed }; s.membershipCredit = 5000;
  s.unlocked = ['first', 'planned', 'return', 'master', 'worker'];
  const migrated = boot({ map: new Map([[KEY, JSON.stringify(s)]]) }).m;
  assert.equal(migrated.corrupt, false); assert.equal(migrated.state().version, 6);
  assert.equal(migrated.state().balance, 4321); assert.equal(migrated.state().totalSpent, 7000);
  assert.equal(migrated.state().earnedTotal, 200000); assert.equal(migrated.workRate(), 50);
  assert.equal(Object.values(migrated.state().earnedByPlan).reduce((a, v) => a + v, 0), 0);
  for (const id of ['return', 'master', 'worker', 'red-worker', 'gold-worker', 'black-worker']) assert.equal(migrated.state().unlocked.includes(id), false);
  assert.equal(migrated.state().unlocked.includes('first'), true);
});

test('invalid member-income ledgers are protected instead of silently reset', () => {
  for (const change of [s => { delete s.earnedByPlan; }, s => { s.earnedByPlan.gold = -50; }, s => { s.earnedByPlan.black = 100; }]) {
    const s = boot().m.state(); change(s);
    const raw = JSON.stringify(s), map = new Map([[KEY, raw]]), { m } = boot({ map });
    assert.equal(m.corrupt, true); assert.equal(map.get(KEY), raw);
  }
});

function memberIncome(b, black = 50000) {
  const s = b.m.state();
  s.earnedByPlan = { ordinary: 10000, gold: 25000, black };
  s.earnedTotal = 35000 + black; s.workCount = 1000 + black / 100;
  b.map.set(KEY, JSON.stringify(s));
  // Reload to apply earned honors just as opening a page does.
  boot({ map: b.map });
}

test('last paid-member work unlocks both secrets together and notifies exactly once', () => {
  const b = boot(); collectRegular(b); memberIncome(b, 49900); b.m.join('black');
  assert.equal(b.m.specialUnlocked(), false); assert.equal(b.m.canView('final-envelope'), false);
  assert.equal(b.m.visibleProducts().length, 9); assert.equal(b.m.honorProgress().total, 8);
  assert.equal(cycle(b).peel.invitationNow, true);
  assert.equal(b.m.specialUnlocked(), true); assert.equal(b.m.canView('final-envelope'), true);
  assert.equal(b.m.visibleProducts().length, 10); assert.equal(b.m.honorProgress().total, 9);
  assert.equal(b.m.collectionProgress().total, 10); assert.equal(b.m.regularHonorCount(), 8);
  assert.equal(cycle(b).peel.invitationNow, false);
  assert.equal(boot({ map: b.map }).m.specialUnlocked(), true);
});

test('finishing all work honors before the ninth purchase keeps both secrets locked until buying it', () => {
  const b = boot(); own(b, 8); memberIncome(b); fund(b, 200000);
  assert.equal(b.m.honorProgress().total, 8); assert.equal(b.m.collectionProgress().total, 9);
  assert.equal(b.m.specialUnlocked(), false); assert.throws(() => b.m.buy('final-envelope'), /ご案内/);
  const last = b.m.buy(b.m.regularProducts[8].id);
  assert.equal(last.invitationNow, true); assert.equal(last.completedNow, false);
  assert.equal(b.m.honorProgress().total, 9); assert.equal(b.m.collectionProgress().total, 10);
  assert.equal(b.m.state().standardCompletion.totalSpent, 71000);
});

test('saved nine-product milestone remains valid while locked, and old full completion is preserved', () => {
  const b = boot(); collectRegular(b);
  const next = boot({ map: b.map }).m;
  assert.equal(next.corrupt, false); assert.equal(next.state().history.length, 9);
  assert.equal(next.state().standardCompletion.totalSpent, 71000); assert.equal(next.specialUnlocked(), false);
  const s = next.state();
  s.history.push({ id: 'OLD-FINAL', productId: 'final-envelope', price: 20000, date: s.lastUsed });
  s.totalSpent += 20000; s.completion = { date: s.lastUsed, totalSpent: s.totalSpent, count: 10 };
  const old = boot({ map: new Map([[KEY, JSON.stringify(s)]]) }).m;
  assert.equal(old.corrupt, false); assert.equal(old.specialUnlocked(), true);
  assert.equal(old.honorProgress().total, 9); assert.equal(old.collectionProgress().total, 10);
  assert.equal(old.state().completion.totalSpent, 91000);
});
