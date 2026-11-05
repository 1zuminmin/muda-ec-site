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
    { id: 'right', name: '何もしない権利', price: 5000, english: 'THE RIGHT TO DO NOTHING', image: 'right.svg', description: '何もしないことを、弊社が勝手に肯定いたします。法的効力はありませんが、休憩の口実にはなるかもしれません。', message: '本日はもう、何もなさらなくて結構です。もともと、その権利はございました。' },
    { id: 'final-envelope', name: '元に戻された封筒', price: 20000, english: 'THE PERFECTLY RESTORED ENVELOPE', image: 'final-envelope.svg', secret: true, description: '幾度も糊で閉じられ、そのたびに剥がされた封筒。その果てにたどり着いたのは、作業前とまったく同じ姿でした。お得意様だけにお届けする、究極の徒労の記念品です。実物は付属いたしません。', message: 'あなたが閉じて、剥がしてきた時間を、ここに買い戻していただきました。封筒は元どおり。お時間は戻りません。' }
  ]);
  const regularProducts = products.filter(p => !p.secret);
  const achievements = Object.freeze([
    { id: 'first', name: '初めての後悔', description: '初めて商品を購入する', target: 1, type: 'count', symbol: 'Ⅰ' },
    { id: 'planned', name: '計画的な浪費', description: '累計500円を無駄にする', target: 500, type: 'spent', symbol: 'Ⅱ' },
    { id: 'return', name: '引き返せない人', description: '累計1,000円を無駄にする', target: 1000, type: 'spent', symbol: 'Ⅲ' },
    { id: 'master', name: '浪費の達人', description: '累計5,000円を無駄にする', target: 5000, type: 'spent', symbol: 'Ⅳ' },
    { id: 'collection', name: '完全なる虚無', description: '異なる3種類の商品を購入する', target: 3, type: 'unique', symbol: 'Ⅴ' },
    { id: 'ultimate', name: '無駄遣いの極致', description: '累計10,000円を無駄にする', target: 10000, type: 'spent', symbol: 'Ⅵ' },
    { id: 'worker', name: '勤勉なる浪費家', description: '内職で累計100円を稼ぐ', target: 100, type: 'earned', symbol: 'Ⅶ' },
    { id: 'regular', name: 'お得意様', description: '通常9種類の商品を購入する', target: regularProducts.length, type: 'regular', symbol: 'Ⅷ' },
    { id: 'complete', name: '真の無駄使いyer', description: '特別なご案内を含む全10種類を購入する', target: products.length, type: 'unique', symbol: 'Ⅸ' }
  ]);
  const plans = Object.freeze([
    { id: 'ordinary', name: '正会員', english: 'RED', tagline: 'まずは、品のある無駄から。', rate: 20, rank: 'Ⅰ', badge: 'insignia-1.svg', badgeDescription: '梅の花と一段の山形を持つ盾章', level: 1 },
    { id: 'gold', name: '特別会員', english: 'GOLD', tagline: '無意味を、たしなむ方へ。', rate: 50, rank: 'Ⅱ', badge: 'insignia-2.svg', badgeDescription: '竹葉と二段の山形を持つ盾章', level: 2 },
    { id: 'black', name: '名誉会員', english: 'BLACK', tagline: '徒労にも、最高の待遇を。', rate: 100, rank: 'Ⅲ', badge: 'insignia-3.svg', badgeDescription: '松葉と三段の山形、月桂樹を持つ盾章', level: 3 }
  ]);
  const initial = () => ({ version: 4, balance: 0, history: [], totalSpent: 0, unlocked: [], lastUsed: new Date().toISOString(), workCount: 0, workLastAt: 0, workPhase: 'seal', earnedTotal: 0, membership: null, profile: { name: '' }, standardCompletion: null, completion: null });
  const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('ja', { granularity: 'grapheme' }) : null;
  const nameLength = name => segmenter ? Array.from(segmenter.segment(name)).length : Array.from(name).length;
  function normalizeName(value) {
    if (typeof value !== 'string') throw new Error('お名前を文字で入力してください。');
    const name = value.normalize('NFC').trim().replace(/\s+/gu, ' ');
    if (nameLength(name) > 20) throw new Error('お名前は20文字以内で入力してください。');
    if (/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(name)) throw new Error('お名前に使用できない制御文字が含まれています。');
    return name;
  }
  function profileValid(profile) {
    try { return profile && typeof profile.name === 'string' && normalizeName(profile.name) === profile.name; }
    catch { return false; }
  }
  const owned = s => new Set(s.history.map(p => p.productId));
  const regularCount = s => regularProducts.filter(p => owned(s).has(p.id)).length;
  const specialUnlocked = s => regularCount(s) === regularProducts.length;
  const isComplete = s => products.every(p => owned(s).has(p.id));
  const valueFor = (a, s) => a.type === 'count' ? s.history.length : a.type === 'unique' ? owned(s).size : a.type === 'regular' ? regularCount(s) : a.type === 'earned' ? s.earnedTotal : s.totalSpent;
  const workRate = s => plans.find(p => p.id === s.membership?.planId)?.rate ?? 10;
  let fallback = initial(), available = true, corrupt = false;
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  const dateValid = d => typeof d === 'string' && Number.isFinite(Date.parse(d));
  const snapshotValid = r => r && dateValid(r.date) && integer(r.totalSpent) && integer(r.count);
  function baseValid(s) {
    return s && [1, 2, 3, 4].includes(s.version) && integer(s.balance) && integer(s.totalSpent) && Array.isArray(s.history) && s.history.every(p => products.some(a => a.id === p.productId && a.price === p.price) && typeof p.id === 'string' && /^[A-Za-z0-9-]+$/.test(p.id) && dateValid(p.date)) && s.history.reduce((sum, p) => sum + p.price, 0) === s.totalSpent && Array.isArray(s.unlocked) && s.unlocked.every(id => achievements.some(a => a.id === id)) && dateValid(s.lastUsed);
  }
  // Only used to safely retire an in-progress result from the previous release.
  function oldRoundValid(r) {
    return r && integer(r.stake) && r.stake >= 100 && r.stake <= 5000 && r.stake % 100 === 0 && ['cho', 'han'].includes(r.choice) && [r.die1, r.die2].every(n => Number.isInteger(n) && n >= 1 && n <= 6) && r.won === (((r.die1 + r.die2) % 2 === 0 ? 'cho' : 'han') === r.choice);
  }
  function valid(s) {
    if (!baseValid(s)) return false;
    if (s.version === 1) return true;
    if (!integer(s.workCount) || !integer(s.workLastAt) || !integer(s.earnedTotal) || !(s.membership === null || (plans.some(p => p.id === s.membership.planId) && dateValid(s.membership.since)))) return false;
    if (s.version === 2) return s.earnedTotal === s.workCount * 10 && Array.isArray(s.rounds) && (s.pendingRound === null || oldRoundValid(s.pendingRound)) && (s.completion === null || snapshotValid(s.completion));
    return (s.version === 3 || profileValid(s.profile)) && ['seal', 'peel'].includes(s.workPhase) && (s.standardCompletion === null || (snapshotValid(s.standardCompletion) && specialUnlocked(s))) && (s.completion === null || (snapshotValid(s.completion) && isComplete(s))) && (!owned(s).has('final-envelope') || specialUnlocked(s));
  }
  function migrate(s) {
    if (s.version === 4) return s;
    if (s.version === 3) return { ...s, version: 4, profile: { name: '' } };
    const next = {
      ...initial(), balance: s.balance, history: s.history, totalSpent: s.totalSpent,
      unlocked: s.unlocked.filter(id => id !== 'complete'), lastUsed: s.lastUsed,
      workCount: s.workCount || 0, earnedTotal: s.earnedTotal || 0, membership: s.membership || null
    };
    if (s.version === 2 && s.pendingRound?.won) next.balance += s.pendingRound.stake * 2;
    if (!integer(next.balance)) throw new Error('Invalid migrated balance');
    if (specialUnlocked(next)) next.standardCompletion = s.completion || { date: s.lastUsed, totalSpent: s.totalSpent, count: s.history.length };
    return next;
  }
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return initial();
      const s = JSON.parse(raw);
      if (!valid(s)) throw new Error('Invalid ledger');
      return migrate(s);
    } catch {
      try { corrupt = localStorage.getItem(KEY) !== null; } catch { available = false; }
      if (corrupt) available = false;
      return structuredClone(fallback);
    }
  }
  function save(s) {
    s.lastUsed = new Date().toISOString(); fallback = structuredClone(s);
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
    s.unlocked.push(...newly.map(a => a.id)); return newly;
  }
  function id() { return 'IS-' + Date.now().toString(36).toUpperCase() + '-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase(); }
  const start = read(); unlock(start); save(start);
  window.Muda = {
    products, regularProducts, achievements, plans, state, valueFor, nameLength,
    recipientName: (s = state()) => s.profile.name || '名もなき浪費家',
    memberPlan: (s = state()) => plans.find(p => p.id === s.membership?.planId) || null,
    setName(value) { const name = normalizeName(value), s = state(); s.profile = { name }; save(s); return name; },
    regularCount: (s = state()) => regularCount(s),
    specialUnlocked: (s = state()) => specialUnlocked(s),
    visibleProducts: (s = state()) => products.filter(p => !p.secret || specialUnlocked(s)),
    canView: (productId, s = state()) => products.some(p => p.id === productId && (!p.secret || specialUnlocked(s))),
    workRate: (s = state()) => workRate(s),
    money: n => '¥' + n.toLocaleString('ja-JP'),
    get persistent() { return available; },
    get corrupt() { return corrupt; },
    buy(productId) {
      const product = products.find(p => p.id === productId), s = state();
      if (!product) throw new Error('商品が見つかりません。');
      if (product.secret && !specialUnlocked(s)) throw new Error('こちらのお品は、まだご案内しておりません。');
      if (s.balance < product.price) throw new Error('架空の所持金が不足しています。「資金づくり」で内職してからお試しください。');
      if (!integer(s.totalSpent + product.price)) throw new Error('累計額が保存できる上限に達しました。');
      const wasInvited = specialUnlocked(s);
      const purchase = { id: id(), productId, price: product.price, date: new Date().toISOString() };
      s.balance -= product.price; s.totalSpent += product.price; s.history.push(purchase);
      const invitationNow = !wasInvited && specialUnlocked(s);
      if (invitationNow) s.standardCompletion = { date: purchase.date, totalSpent: s.totalSpent, count: s.history.length };
      const completedNow = !s.completion && isComplete(s);
      if (completedNow) s.completion = { date: purchase.date, totalSpent: s.totalSpent, count: s.history.length };
      const newly = unlock(s); save(s);
      return { purchase, product, newly, invitationNow, completedNow };
    },
    workStep(action) {
      const s = state(), now = Date.now();
      if (!['seal', 'peel'].includes(action) || action !== s.workPhase) throw new Error('いまの作業手順をご確認ください。');
      if (now - s.workLastAt < 180) return null;
      let amount = 0;
      if (action === 'seal') s.workPhase = 'peel';
      else {
        amount = workRate(s);
        if (!integer(s.balance + amount) || !integer(s.earnedTotal + amount) || !integer(s.workCount + 1)) throw new Error('保存できる金額の上限に達しました。');
        s.balance += amount; s.earnedTotal += amount; s.workCount++; s.workPhase = 'seal';
      }
      s.workLastAt = now;
      const newly = unlock(s); save(s);
      return { amount, phase: s.workPhase, newly };
    },
    join(planId) {
      if (!plans.some(p => p.id === planId)) throw new Error('会員プランを選んでください。');
      const s = state(); s.membership = { planId, since: s.membership?.since || new Date().toISOString() }; save(s);
    },
    leave() { const s = state(); s.membership = null; save(s); },
    resetBalance() { const s = state(); s.balance = 0; return save(s); },
    clear() {
      try { localStorage.removeItem(KEY); corrupt = false; available = true; } catch { available = false; }
      return save(initial());
    }
  };
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) window.dispatchEvent(new CustomEvent('muda:update', { detail: state() })); });
})();
