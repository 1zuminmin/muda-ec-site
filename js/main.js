(() => {
  'use strict';
  const M = window.Muda;
  const page = document.body.dataset.page;
  document.getElementById('site-header').innerHTML = `<header class="site-header"><a class="brand" href="index.html" aria-label="無駄遣い商会 ホーム"><img src="assets/images/mark.svg" width="40" height="40" alt=""><span>無駄遣い商会<small>MUDAZUKAI SHOKAI</small></span></a><nav aria-label="メインナビゲーション"><a href="index.html" ${page === 'home' ? 'aria-current="page"' : ''}>商会について</a><a href="shop.html" ${page === 'shop' ? 'aria-current="page"' : ''}>商品一覧</a><a href="achievements.html" ${page === 'achievements' ? 'aria-current="page"' : ''}>実績</a></nav><a class="header-wallet" href="shop.html"><span>架空の所持金</span><strong data-balance>¥10,000</strong></a></header>`;
  document.getElementById('site-footer').innerHTML = `<footer class="site-footer section"><div class="footer-top"><a class="brand" href="index.html"><img src="assets/images/mark.svg" width="36" height="36" alt=""><span>無駄遣い商会<small>MUDAZUKAI SHOKAI</small></span></a><p>あなたのお金を、全力で無駄にする場所。</p></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} 無駄遣い商会</span><span>架空の購入・実際の支払いなし。すべて無料のシミュレーションです。</span></div><p class="storage-note">記録はこのブラウザに保存されます。ブラウザのデータを削除すると記録は失われます。</p></footer>`;
  M.card = (p, index, buying = false) => `<article class="product-card"><${buying ? 'div' : 'a href="shop.html"'} class="product-image"><img src="assets/images/${p.image}" alt="${p.name}" loading="lazy"><span class="product-number">N° 00${index + 1}</span><span class="product-label">${p.id === 'void' ? '何もない、という完成形。' : p.id === 'dot' ? '一点の、曇りなき無意味。' : 'どこにでもある、特別。'}</span></${buying ? 'div' : 'a'}><div class="product-info"><p class="eyebrow">${p.english}</p><div class="product-title"><h3>${p.name}</h3><span>${M.money(p.price)}<small>架空</small></span></div><p class="product-description">${p.description}</p>${buying ? `<button class="button buy-button" data-buy="${p.id}">架空購入する <span>↗</span></button>` : '<a class="product-more" href="shop.html">この無駄を詳しく <span>↗</span></a>'}</div></article>`;
  M.toast = (title, message = '') => {
    const toast = document.createElement('div'); toast.className = 'toast';
    const strong = document.createElement('strong'); strong.textContent = title; toast.append(strong);
    if (message) { const p = document.createElement('p'); p.textContent = message; toast.append(p); }
    document.getElementById('toast-region').append(toast);
    setTimeout(() => toast.remove(), 6500);
  };
  function update() {
    const s = M.state();
    document.querySelectorAll('[data-balance]').forEach(el => el.textContent = M.money(s.balance));
    document.querySelectorAll('[data-stat]').forEach(el => el.textContent = el.dataset.stat === 'spent' ? M.money(s.totalSpent) : el.dataset.stat === 'count' ? s.history.length : s.unlocked.length);
    if (!M.persistent && !document.querySelector('.storage-warning')) {
      const warning = document.createElement('p'); warning.className = 'storage-warning'; warning.setAttribute('role', 'status');
      warning.textContent = M.corrupt ? '保存済みの記録を読み込めませんでした。元の記録は保護されています。現在は一時モードです。ショップの「すべての記録を削除」で初期化できます。' : 'ブラウザに保存できません。現在の記録はこのページを閉じると失われます。保存領域の空きとブラウザの設定をご確認ください。';
      document.querySelector('main').prepend(warning);
    } else if (M.persistent) document.querySelector('.storage-warning')?.remove();
  }
  document.getElementById('featured-products')?.insertAdjacentHTML('beforeend', M.products.map((p, i) => M.card(p, i)).join(''));
  window.addEventListener('muda:update', update); update();
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => { el.classList.add('will-reveal'); observer.observe(el); });
  }
})();
