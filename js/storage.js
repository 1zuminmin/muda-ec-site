/* Shared catalog and browser-local ledger. No network or real payments. */
(() => {
  'use strict';
  const KEY = 'muda-shokai:v1';
  const products = Object.freeze([
    { id: 'stone', name: 'ただの石ころの画像', price: 100, english: 'THE ORDINARY STONE', image: 'stone.svg', description: '厳選された、どこにでもありそうな石ころをデジタルデータとしてお届けします。実物の石は付属いたしません。', message: '石の上にも三年。こちらの画像の上には、何年いても何も起きません。' },
    { id: 'dot', name: '高級な黒い点', price: 300, english: 'THE EXQUISITE DOT', image: 'dot.svg', description: '熟練の技術によって配置された、極めて高品質な黒い点です。拡大しても黒い点であることに変わりはありません。', message: 'この一点が、あなたの人生を変えることは、おそらくありません。' },
    { id: 'void', name: '究極の虚無', price: 1000, english: 'THE ABSOLUTE NOTHING', image: 'void.svg', description: '何もありません。それ以上でも、それ以下でもありません。弊社の技術の粋を集め、究極の無意味を実現しました。', message: 'お届けするものが何もないため、すでにお届けが完了しております。' }
  ]);
  const achievements = Object.freeze([
    { id: 'first', name: '初めての後悔', description: '初めて商品を購入する', target: 1, type: 'count', symbol: 'Ⅰ' },
    { id: 'planned', name: '計画的な浪費', description: '累計500円を無駄にする', target: 500, type: 'spent', symbol: 'Ⅱ' },
    { id: 'return', name: '引き返せない人', description: '累計1,000円を無駄にする', target: 1000, type: 'spent', symbol: 'Ⅲ' },
    { id: 'master', name: '浪費の達人', description: '累計5,000円を無駄にする', target: 5000, type: 'spent', symbol: 'Ⅳ' },
    { id: 'collection', name: '完全なる虚無', description: '3種類すべての商品を購入する', target: 3, type: 'unique', symbol: 'Ⅴ' },
    { id: 'ultimate', name: '無駄遣いの極致', description: '累計10,000円を無駄にする', target: 10000, type: 'spent', symbol: 'Ⅵ' }
  ]);
  const initial = () => ({ version: 1, balance: 10000, history: [], totalSpent: 0, unlocked: [], lastUsed: new Date().toISOString() });
  const valueFor = (a, s) => a.type === 'count' ? s.history.length : a.type === 'unique' ? new Set(s.history.map(p => p.productId)).size : s.totalSpent;
  let fallback = initial();
  let available = true;
  let corrupt = false;
  const valid = s => s && s.version === 1 && Number.isSafeInteger(s.balance) && s.balance >= 0 && s.balance <= 10000 && Number.isSafeInteger(s.totalSpent) && s.totalSpent >= 0 && Array.isArray(s.history) && s.history.every(p => products.some(a => a.id === p.productId && a.price === p.price) && typeof p.id === 'string' && /^[A-Za-z0-9-]+$/.test(p.id) && Number.isFinite(Date.parse(p.date))) && s.history.reduce((sum, p) => sum + p.price, 0) === s.totalSpent && Array.isArray(s.unlocked) && s.unlocked.every(id => achievements.some(a => a.id === id)) && Number.isFinite(Date.parse(s.lastUsed));
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return initial();
      const s = JSON.parse(raw);
      if (!valid(s)) throw new Error('Invalid ledger');
      return s;
    } catch (e) {
      // Keep unreadable records untouched until the user explicitly deletes them.
      try { corrupt = localStorage.getItem(KEY) !== null; } catch { available = false; }
      if (corrupt) available = false;
      return structuredClone(fallback);
    }
  }
  function save(s) {
    s.lastUsed = new Date().toISOString();
    fallback = structuredClone(s);
    if (!corrupt) {
      try { localStorage.setItem(KEY, JSON.stringify(s)); available = true; }
      catch { available = false; }
    }
    window.dispatchEvent(new CustomEvent('muda:update', { detail: s }));
    return s;
  }
  function state() { return available ? read() : structuredClone(fallback); }
  const start = read();
  save(start);
  window.Muda = {
    products, achievements, state, valueFor,
    money: n => '¥' + n.toLocaleString('ja-JP'),
    get persistent() { return available; },
    get corrupt() { return corrupt; },
    buy(productId) {
      const product = products.find(p => p.id === productId);
      const s = state();
      if (!product) throw new Error('商品が見つかりません。');
      if (s.balance < product.price) throw new Error('架空の所持金が不足しています。所持金をリセットしてからお試しください。');
      const purchase = { id: 'MS-' + Date.now().toString(36).toUpperCase() + '-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase(), productId, price: product.price, date: new Date().toISOString() };
      s.balance -= product.price;
      s.totalSpent += product.price;
      s.history.push(purchase);
      const newly = achievements.filter(a => !s.unlocked.includes(a.id) && valueFor(a, s) >= a.target);
      s.unlocked.push(...newly.map(a => a.id));
      save(s);
      return { purchase, product, newly };
    },
    resetBalance() { const s = state(); s.balance = 10000; return save(s); },
    clear() {
      try { localStorage.removeItem(KEY); corrupt = false; available = true; } catch { available = false; }
      return save(initial());
    }
  };
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) window.dispatchEvent(new CustomEvent('muda:update', { detail: state() })); });
})();
