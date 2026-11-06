const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..'), KEY = 'muda-shokai:v1';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function boot(map = new Map(), extras = {}) {
  const window = new EventTarget();
  const context = vm.createContext({ window, CustomEvent, structuredClone, crypto: require('node:crypto').webcrypto, Date, localStorage: { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }, ...extras });
  vm.runInContext(read('js/storage.js'), context);
  return { m: window.Muda, window, map, context };
}
test('registered names normalize and persist independently of money and memberships', () => {
  const { m, map } = boot(); const funded = m.state(); funded.balance = 7000; map.set(KEY, JSON.stringify(funded)); m.buy('stone'); m.buy('dot'); m.join('gold'); m.setName('　徒労   太郎　');
  assert.equal(m.state().profile.name, '徒労 太郎'); assert.equal(m.state().balance, 0); assert.equal(m.state().membership.planId, 'gold'); assert.equal(boot(map).m.recipientName(), '徒労 太郎');
});
test('names support Japanese, emoji graphemes, clearing and NFC normalization', () => {
  const { m } = boot(); const family = '👨‍👩‍👧‍👦';
  m.setName(family.repeat(20)); assert.equal(m.nameLength(m.state().profile.name), 20);
  m.setName('か\u3099'); assert.equal(m.state().profile.name, 'が');
  m.setName('   '); assert.equal(m.state().profile.name, ''); assert.equal(m.recipientName(), '名もなき浪費家');
});
test('invalid names do not change stored data', () => {
  const { m } = boot(); m.setName('浪費家'); const before = JSON.stringify(m.state());
  for (const name of ['あ'.repeat(21), '名前\u0000', '名前\u202e', 42, null]) assert.throws(() => m.setName(name));
  assert.equal(JSON.stringify(m.state()), before);
});
test('v3 migration retains completed collection, money, work and plan with an empty new name', () => {
  const { m } = boot(), s = m.state(); s.version = 3; delete s.profile;
  s.balance = 1234; s.earnedTotal = 40000; s.workCount = 400; s.workPhase = 'peel'; s.membership = { planId: 'black', since: s.lastUsed };
  s.history = m.products.map((p, i) => ({ id: `OLD-${i}`, productId: p.id, price: p.legacyPrice, date: s.lastUsed }));
  s.totalSpent = 34200; s.standardCompletion = { date: s.lastUsed, totalSpent: 14200, count: 9 }; s.completion = { date: s.lastUsed, totalSpent: 34200, count: 10 }; s.unlocked = ['complete'];
  const migrated = boot(new Map([[KEY, JSON.stringify(s)]])).m;
  assert.equal(migrated.state().version, 5); assert.equal(migrated.state().balance, 1234); assert.equal(migrated.state().workPhase, 'peel'); assert.equal(migrated.workRate(), 100); assert.equal(migrated.state().completion.totalSpent, 34200); assert.equal(migrated.state().profile.name, ''); assert.equal(migrated.corrupt, false);
});
test('fund reset and membership changes retain name, while full reset deletes it', () => {
  const { m } = boot(); m.setName('無駄 太郎'); m.leave(); m.resetBalance(); m.leave(); assert.equal(m.recipientName(), '無駄 太郎'); m.clear(); assert.equal(m.state().profile.name, '');
});
test('badge tier assets are distinct shapes in the same color and keep existing reward rates', () => {
  const { m } = boot(); const svgs = m.plans.map(p => read(`assets/images/${p.badge}`));
  assert.equal(new Set(svgs).size, 3); assert.deepEqual(Array.from(m.plans, p => p.level), [1, 2, 3]); assert.deepEqual(Array.from(m.plans, p => p.rate), [20, 50, 100]);
  for (const svg of svgs) { assert.ok(svg.includes('#baa57a')); const colors = svg.match(/#[0-9a-f]{6}/gi) || []; assert.ok(colors.every(c => c === '#baa57a')); }
});
test('my page renders the name as literal text and preserves an unsaved draft during updates', () => {
  class Element { constructor() { this.handlers = {}; this.value = ''; this.dataset = {}; } addEventListener(t, fn) { this.handlers[t] = fn; } setAttribute() {} setCustomValidity() {} }
  const nodes = new Map([...read('mypage.html').matchAll(/id="([^"]+)"/g)].map(m => [m[1], new Element()]));
  const document = { getElementById(id) { assert.ok(nodes.has(id), `Missing ${id}`); return nodes.get(id); } };
  const { m, context } = boot(new Map(), { document }); m.badgeHTML = () => ''; m.toast = () => {};
  vm.runInContext(read('js/mypage.js'), context);
  m.setName('<b>太郎</b>'); assert.equal(nodes.get('profile-display-name').textContent, '<b>太郎</b>');
  const input = nodes.get('profile-name'); input.value = '編集中'; input.handlers.input(); m.leave(); assert.equal(input.value, '編集中'); assert.equal(m.state().profile.name, '<b>太郎</b>');
  nodes.get('profile-form').handlers.submit({ preventDefault() {} }); assert.equal(m.state().profile.name, '編集中'); assert.equal(nodes.get('profile-display-name').textContent, '編集中');
});
test('purchase and final certificates use the name at generation, including reissued awards', async () => {
  const texts = [], images = [];
  const ctx = { fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillText(text) { texts.push(text); } };
  const document = { fonts: { ready: Promise.resolve() }, body: { append() {} }, createElement(tag) {
    if (tag === 'canvas') return { getContext: () => ctx, toBlob: resolve => resolve(new Blob(['png'])) };
    return { click() { images.push(this.download); }, remove() {} };
  } };
  const { m, map, context } = boot(new Map(), { document, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }, setTimeout: () => 0, URLSearchParams, location: { protocol: 'http:', hostname: 'localhost' } });
  const s = m.state(); s.history = m.products.map((p, i) => ({ id: `PURCHASE-${i}`, productId: p.id, price: p.legacyPrice, date: s.lastUsed })); s.totalSpent = 34200; s.completion = { date: s.lastUsed, totalSpent: 34200, count: 10 }; map.set(KEY, JSON.stringify(s));
  m.setName('徒労 太郎'); vm.runInContext(read('js/certificate.js'), context);
  await m.downloadCertificate(s.history[0]); assert.ok(texts.includes('徒労 太郎 様')); assert.ok(texts.includes('ただの石ころの画像'));
  texts.length = 0; m.setName('無益 花子'); await m.downloadCompletion(); assert.ok(texts.includes('無益 花子 様')); assert.ok(!texts.includes('徒労 太郎 様'));
  texts.length = 0; m.setName(''); await m.downloadCertificate(s.history[0]); assert.ok(texts.includes('名もなき浪費家 様')); assert.equal(images.length, 3);
});
