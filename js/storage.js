/* Shared catalog and browser-local ledger. No network or real payments. */
(() => {
  'use strict';
  const KEY = 'muda-shokai:v1';
  const products = Object.freeze([
    { id: 'stone', name: 'ただの石ころの画像', price: 100, english: 'THE ORDINARY STONE', image: 'stone-lit.png', description: '厳選された、どこにでもありそうな石ころをデジタルデータとしてお届けします。実物の石は付属いたしません。', message: '石の上にも三年。こちらの画像の上には、何年いても何も起きません。' },
    { id: 'dot', name: '高級な黒い点', price: 300, english: 'THE EXQUISITE DOT', image: 'dot.svg', description: '熟練の技術によって配置された、極めて高品質な黒い点です。拡大しても黒い点であることに変わりはありません。', message: 'この一点が、あなたの人生を変えることは、おそらくありません。' },
    { id: 'void', name: '究極の虚無', price: 1000, english: 'THE ABSOLUTE NOTHING', image: 'void.svg', description: '何もありません。それ以上でも、それ以下でもありません。弊社の技術の粋を集め、究極の無意味を実現しました。', message: 'お届けするものが何もないため、すでにお届けが完了しております。' },
    { id: 'air', name: '選び抜かれた空気', price: 500, english: 'THE SELECTED AIR', image: 'air.svg', description: 'どこにでもある空気から、特に何も選別せずお届けする気持ちだけをご用意しました。容器も空気も届きません。', message: 'お気に召しましたら、いま一度、深呼吸を。そちらは無料です。' },
    { id: 'margin', name: '贅沢な余白', price: 800, english: 'THE GENEROUS MARGIN', image: 'margin.svg', description: '何かを書くこともできない、鑑賞専用の余白です。何も書かない勇気を、ぜひお手元に。', message: 'お客様の資産にも、少し余白が生まれました。' },
    { id: 'receipt', name: '領収書のための領収書', price: 1500, english: 'THE RECURSIVE RECEIPT', image: 'receipt.svg', description: '領収書を手に入れたことを証明するための、架空の領収書です。経費としての用途は一切ありません。', message: '何を買ったかはともかく、買ったという事実だけは残りました。' },
    { id: 'sigh', name: '熟成されたため息', price: 2000, english: 'THE AGED SIGH', image: 'sigh.svg', description: '長い会議の終わりを思わせる、深い余韻。音声は付属いたしません。ため息はお客様自身でお願いいたします。', message: 'はぁ。そのひと言で、品質をご実感いただけたかと存じます。' },
    { id: 'waiting', name: '永遠の待機画面', price: 3000, english: 'THE ETERNAL WAIT', image: 'waiting.svg', description: '完了することのない待ち時間を、静止画に封じ込めました。読み込みが終わる見込みはございません。', message: 'まもなく完了いたします、という気持ちだけお届けします。' },
    { id: 'right', name: '何もしない権利', price: 5000, english: 'THE RIGHT TO DO NOTHING', image: 'right.svg', description: '何もしないことを、弊社が勝手に肯定いたします。法的効力はありませんが、休憩の口実にはなるかもしれません。', message: '本日はもう、何もなさらなくて結構です。もともと、その権利はございました。' }
  ]);
  const achievements = Object.freeze([
    { id: 'first', name: '初めての後悔', description: '初めて商品を購入する', target: 1, type: 'count', symbol: 'Ⅰ' },
    { id: 'planned', name: '計画的な浪費', description: '累計500円を無駄にする', target: 500, type: 'spent', symbol: 'Ⅱ' },
    { id: 'return', name: '引き返せない人', description: '累計1,000円を無駄にする', target: 1000, type: 'spent', symbol: 'Ⅲ' },
    { id: 'master', name: '浪費の達人', description: '累計5,000円を無駄にする', target: 5000, type: 'spent', symbol: 'Ⅳ' },
    { id: 'collection', name: '完全なる虚無', description: '異なる3種類の商品を購入する', target: 3, type: 'unique', symbol: 'Ⅴ' },
    { id: 'ultimate', name: '無駄遣いの極致', description: '累計10,000円を無駄にする', target: 10000, type: 'spent', symbol: 'Ⅵ' },
    { id: 'worker', name: '勤勉なる浪費家', description: '内職で累計100円を稼ぐ', target: 100, type: 'earned', symbol: 'Ⅶ' },
    { id: 'complete', name: '真の無駄使いyer', description: '全9種類の商品を購入する', target: products.length, type: 'unique', symbol: 'Ⅷ' }
  ]);
  const plans = Object.freeze([
    { id: 'ordinary', name: '平会員', english: 'ORDINARY', tagline: 'まずは、品のある無駄から。', future: '内職報酬の少額アップを検討中', rank: 'Ⅰ' },
    { id: 'gold', name: '浪費家会員', english: 'GOLD', tagline: '無意味を、たしなむ方へ。', future: '内職の連続作業ボーナスを検討中', rank: 'Ⅱ' },
    { id: 'black', name: '虚無の賓客', english: 'BLACK', tagline: 'その先には、何もございません。', future: '内職効率アップの追加特典を検討中', rank: 'Ⅲ' }
  ]);
  const initial = () => ({ version: 2, balance: 10000, history: [], totalSpent: 0, unlocked: [], lastUsed: new Date().toISOString(), workCount: 0, workLastAt: 0, earnedTotal: 0, rounds: [], pendingRound: null, membership: null, completion: null });
  const valueFor = (a, s) => a.type === 'count' ? s.history.length : a.type === 'unique' ? new Set(s.history.map(p => p.productId)).size : a.type === 'earned' ? s.earnedTotal : s.totalSpent;
  let fallback = initial();
  let available = true;
  let corrupt = false;
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  const dateValid = d => typeof d === 'string' && Number.isFinite(Date.parse(d));
  const roundValid = r => r && typeof r.id === 'string' && /^[A-Za-z0-9-]+$/.test(r.id) && integer(r.stake) && r.stake >= 100 && r.stake <= 5000 && r.stake % 100 === 0 && ['cho', 'han'].includes(r.choice) && [r.die1, r.die2].every(n => Number.isInteger(n) && n >= 1 && n <= 6) && typeof r.won === 'boolean' && r.won === (((r.die1 + r.die2) % 2 === 0 ? 'cho' : 'han') === r.choice) && dateValid(r.date);
  function valid(s) {
    return s && [1, 2].includes(s.version) && integer(s.balance) && integer(s.totalSpent) && Array.isArray(s.history) && s.history.every(p => products.some(a => a.id === p.productId && a.price === p.price) && typeof p.id === 'string' && /^[A-Za-z0-9-]+$/.test(p.id) && dateValid(p.date)) && s.history.reduce((sum, p) => sum + p.price, 0) === s.totalSpent && Array.isArray(s.unlocked) && s.unlocked.every(id => achievements.some(a => a.id === id)) && dateValid(s.lastUsed) && (s.version === 1 || (integer(s.workCount) && integer(s.workLastAt) && integer(s.earnedTotal) && s.earnedTotal === s.workCount * 10 && Array.isArray(s.rounds) && s.rounds.length <= 30 && s.rounds.every(roundValid) && (s.pendingRound === null || roundValid(s.pendingRound)) && (s.membership === null || (plans.some(p => p.id === s.membership.planId) && dateValid(s.membership.since))) && (s.completion === null || (dateValid(s.completion.date) && integer(s.completion.totalSpent) && integer(s.completion.count) && new Set(s.history.map(p => p.productId)).size === products.length))));
  }
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return initial();
      const s = JSON.parse(raw);
      if (!valid(s)) throw new Error('Invalid ledger');
      return s.version === 1 ? { ...initial(), ...s, version: 2 } : s;
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
  function unlock(s) {
    const newly = achievements.filter(a => !s.unlocked.includes(a.id) && valueFor(a, s) >= a.target);
    s.unlocked.push(...newly.map(a => a.id));
    return newly;
  }
  function id(prefix) { return prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase(); }
  function die() {
    // Rejection sampling avoids modulo bias for six equally likely faces.
    const value = new Uint32Array(1);
    do { crypto.getRandomValues(value); } while (value[0] >= 4294967292);
    return value[0] % 6 + 1;
  }
  function canAdd(s, amount) { if (!Number.isSafeInteger(s.balance + amount)) throw new Error('これ以上の架空資金は保管できません。少し無駄遣いしてからお試しください。'); }
  const start = read();
  unlock(start);
  save(start);
  window.Muda = {
    products, achievements, plans, state, valueFor,
    money: n => '¥' + n.toLocaleString('ja-JP'),
    get persistent() { return available; },
    get corrupt() { return corrupt; },
    buy(productId) {
      const product = products.find(p => p.id === productId);
      const s = state();
      if (!product) throw new Error('商品が見つかりません。');
      if (s.balance < product.price) throw new Error('架空の所持金が不足しています。「資金づくり」で内職するか、所持金をリセットしてからお試しください。');
      const purchase = { id: id('IS'), productId, price: product.price, date: new Date().toISOString() };
      s.balance -= product.price;
      s.totalSpent += product.price;
      s.history.push(purchase);
      const newly = unlock(s);
      const completedNow = !s.completion && new Set(s.history.map(p => p.productId)).size === products.length;
      if (completedNow) s.completion = { date: purchase.date, totalSpent: s.totalSpent, count: s.history.length };
      save(s);
      return { purchase, product, newly, completedNow };
    },
    work() {
      const s = state(), now = Date.now();
      if (now - s.workLastAt < 180) return null;
      canAdd(s, 10); s.balance += 10; s.earnedTotal += 10; s.workCount++; s.workLastAt = now;
      const newly = unlock(s); save(s); return { amount: 10, newly };
    },
    startRound(stake, choice) {
      const s = state();
      if (s.pendingRound) throw new Error('前の勝負の結果をご確認ください。');
      if (!Number.isInteger(stake) || stake < 100 || stake > 5000 || stake % 100 !== 0) throw new Error('掛け金は100〜5,000円の100円単位で指定してください。');
      if (!['cho', 'han'].includes(choice)) throw new Error('丁か半を選んでください。');
      if (stake > s.balance) throw new Error('架空の所持金が足りません。内職で資金をお作りください。');
      canAdd(s, stake);
      const die1 = die(), die2 = die(), won = ((die1 + die2) % 2 === 0 ? 'cho' : 'han') === choice;
      s.balance -= stake;
      s.pendingRound = { id: id('DICE'), stake, choice, die1, die2, won, date: new Date().toISOString() };
      // Persist the committed dice result before animation, so reloads cannot reroll.
      save(s); return structuredClone(s.pendingRound);
    },
    settleRound() {
      const s = state(), round = s.pendingRound;
      if (!round) return null;
      if (round.won) { canAdd(s, round.stake * 2); s.balance += round.stake * 2; }
      s.rounds.unshift(round); s.rounds = s.rounds.slice(0, 30); s.pendingRound = null;
      save(s); return round;
    },
    join(planId) {
      if (!plans.some(p => p.id === planId)) throw new Error('会員プランを選んでください。');
      const s = state(); s.membership = { planId, since: s.membership?.since || new Date().toISOString() }; save(s);
    },
    leave() { const s = state(); s.membership = null; save(s); },
    resetBalance() { const s = state(); s.balance = 10000; return save(s); },
    clear() {
      try { localStorage.removeItem(KEY); corrupt = false; available = true; } catch { available = false; }
      return save(initial());
    }
  };
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) window.dispatchEvent(new CustomEvent('muda:update', { detail: state() })); });
})();
