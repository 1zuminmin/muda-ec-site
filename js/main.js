(() => {
  'use strict';
  const M = window.Muda;
  const page = document.body.dataset.page;
  const config = window.IminaiConfig || {};
  const creatorHandle = typeof config.creatorX === 'string' ? config.creatorX.trim().replace(/^@/, '') : '';
  M.creatorURL = /^[A-Za-z0-9_]{1,15}$/.test(creatorHandle) ? 'https://x.com/' + creatorHandle : '';
  const creatorLink = (label, className = 'text-link') => M.creatorURL ? `<a class="${className}" href="${M.creatorURL}" target="_blank" rel="noopener noreferrer">${label} ↗</a>` : '';
  const streamingText = config.streamingPolicy === 'monetized'
    ? 'ゲーム画面のスクリーンショット投稿・実況・配信は、動画や配信の収益化を含めてご利用いただけます。説明欄などにサイト名「伊見内商会」と公開URLをご紹介いただけるとうれしいです。紹介は許可の条件ではありません。'
    : config.streamingPolicy === 'noncommercial'
      ? 'ゲーム画面のスクリーンショット投稿・実況・配信は、収益を得ない利用に限りご利用いただけます。収益化する場合は、事前に作者へご相談ください。サイト名と公開URLをご紹介いただけるとうれしいです。'
      : '実況・配信・スクリーンショットの一般公開に関する方針は、現在確認中です。個別のご相談は作者ページをご確認ください。';
  document.querySelectorAll('[data-streaming-policy]').forEach(el => { el.textContent = streamingText; });
  document.querySelectorAll('[data-streaming-pending]').forEach(el => { el.hidden = config.streamingPolicy !== 'pending'; });
  document.querySelectorAll('[data-creator-x]').forEach(el => {
    el.hidden = !M.creatorURL;
    if (M.creatorURL) { el.href = M.creatorURL; el.textContent = '作者のX @' + creatorHandle + ' ↗'; }
  });
  document.querySelectorAll('[data-creator-unset]').forEach(el => { el.hidden = !!M.creatorURL; });
  const links = [{ page: 'home', href: 'index.html', name: '商会について' }, { page: 'shop', href: 'shop.html', name: '商品一覧' }, { page: 'earn', href: 'earn.html', name: '資金づくり' }, { page: 'achievements', href: 'achievements.html', name: '実績' }, { page: 'membership', href: 'membership.html', name: '会員サロン' }];
  document.getElementById('site-header').innerHTML = `<header class="site-header"><a class="brand" href="index.html" aria-label="伊見内商会 ホーム"><img src="assets/images/mark.svg" width="40" height="40" alt=""><span>伊見内商会<small>IMINAI SHOKAI</small></span></a><nav aria-label="メインナビゲーション">${links.map(l => `<a href="${l.href}" ${page === l.page ? 'aria-current="page"' : ''}>${l.name}</a>`).join('')}</nav><div class="account-hub"><a class="header-wallet" href="earn.html"><span>架空の所持金</span><strong data-balance>¥0</strong></a><a class="header-profile" href="mypage.html" ${page === 'mypage' ? 'aria-current="page"' : ''}><span class="header-profile-copy"><span>マイページ</span><strong data-profile-name>お客様</strong></span><img class="member-insignia" data-profile-badge src="assets/images/insignia-0.svg" alt="未入会の盾章" width="32" height="40"></a></div></header>`;
  document.getElementById('site-footer').innerHTML = `<footer class="site-footer section"><div class="footer-top"><a class="brand" href="index.html"><img src="assets/images/mark.svg" width="36" height="36" alt=""><span>伊見内商会<small>IMINAI SHOKAI</small></span></a><p>あなたのお金を、全力で無駄にする場所。</p></div><nav class="footer-links" aria-label="フッターナビゲーション"><a href="mypage.html">マイページ</a><a href="earn.html">資金づくり</a><a href="membership.html">会員サロン</a><a href="author.html" ${page === 'author' ? 'aria-current="page"' : ''}>作者のボヤキ ↗</a>${creatorLink('作者のX', '')}<a href="honor-roll.html">無駄名誉会員一覧</a><a href="terms.html">利用規約</a><a href="privacy.html">プライバシー</a></nav><div class="footer-bottom"><span>© ${new Date().getFullYear()} 伊見内商会</span><span>架空の購入・実際の支払いなし。すべて無料のシミュレーションです。</span></div><p class="storage-note">記録はこのブラウザに保存されます。ブラウザのデータを削除すると記録は失われます。</p></footer>`;
  M.card = (p, index, buying = false) => `<article class="product-card" data-product="${p.id}"><${buying ? 'div' : `a href="product.html?id=${p.id}"`} class="product-image"><img src="assets/images/${p.image}" alt="${p.name}" loading="lazy"><span class="product-number">N° ${String(index + 1).padStart(3, '0')}</span><span class="product-label">${p.id === 'void' ? '何もない、という完成形。' : p.id === 'dot' ? '一点の、曇りなき無意味。' : p.id === 'stone' ? 'どこにでもある、特別。' : '必要ないから、美しい。'}</span></${buying ? 'div' : 'a'}><div class="product-info"><p class="eyebrow">${p.english}</p><div class="product-title"><h3>${p.name}</h3><span>${M.money(p.price)}<small>架空</small></span></div><p class="product-description">${p.description}</p>${buying ? `<a class="product-more" href="product.html?id=${p.id}">詳細・架空レビューを見る <span>↗</span></a><p class="owned-label" data-owned="${p.id}"></p><button class="button buy-button" data-buy="${p.id}">架空購入する <span>↗</span></button>` : `<a class="product-more" href="product.html?id=${p.id}">詳細・架空レビューを見る <span>↗</span></a>`}</div></article>`;
  M.badgeHTML = (plan = M.memberPlan()) => `<img class="member-insignia" src="assets/images/${plan?.badge || 'insignia-0.svg'}" alt="${plan ? `${plan.name}・${plan.badgeDescription}` : '未入会・山形のない盾章'}" width="64" height="76">`;
  M.completionText = 'あなたは真の無駄使いyerです。あなたはお金だけでなく、時間も無駄にしてくれました。ありがとうございました。';
  M.summaryShareURL = () => {
    const s = M.state(), { count, total } = M.collectionProgress(s);
    return M.xShareURL(`伊見内商会で累計${M.money(s.totalSpent)}を無駄にしました。\n無用の品 ${count} / ${total}種類。${s.completion ? '\n特別な一品まで制覇。真の無駄使いyerになりました。' : '\nここまでの無意味を、ご報告いたします。'}\n架空の購入・実際の支払いなし\n#伊見内商会 #無駄遣い`);
  };
  M.notifyAchievements = newly => newly.forEach((a, i) => setTimeout(() => M.toast('実績解除 — ' + a.name, a.description), i * 700));
  function renderCollection(s) {
    const node = document.getElementById('collection-status');
    if (!node) return;
    const { count, total } = M.collectionProgress(s), invited = M.specialUnlocked(s);
    node.innerHTML = s.completion ? `<section class="completion-board" aria-label="全商品購入の感謝状"><p class="eyebrow">WITH OUR DEEPEST, MOST USELESS GRATITUDE</p><div class="completion-mark" aria-hidden="true">◇</div><h2>すべての無意味を、あなたへ。</h2><p class="completion-quote">${M.completionText}</p><p class="subtle">特別な一品を含む全${M.products.length}種類を収集 ／ 達成時の累計 ${M.money(s.completion.totalSpent)}（架空）</p><div class="inline-actions"><button class="button gold" data-download-completion>完全クリアの感謝状をPNGで保存 ↓</button><a class="button outline" href="${M.summaryShareURL()}" target="_blank" rel="noopener noreferrer">完全クリアをXで共有 ↗</a></div><p class="fine">会員番号の発行は今後対応予定です。感謝状は何度でも保存できます。</p><p><a class="text-link" href="honor-roll.html#request">無駄名誉会員一覧への掲載について ↗</a></p><div class="completion-author"><p>最後までお付き合いいただき、ありがとうございました。</p>${M.creatorURL ? creatorLink('この無意味を作った作者のX') : '<a class="text-link" href="author.html#creator">作者の制作室へ ↗</a>'}</div></section>` : `<section class="collection-progress"><div><p class="eyebrow">YOUR COLLECTION</p><h3>${invited ? 'お得意様への特別なご案内です。' : '無用の品を、ひとつずつ。'}</h3><p>${invited ? '通常9品を揃えたあなたに、最後の一品をご用意しました。' : M.regularCount(s) < 8 ? 'まずは8品を目指して、無意味を集めてみませんか。' : '8品が揃いました。次は9品目の無意味を、お手元に。'}</p>${invited ? '<a class="text-link" href="shop.html#private-collection">特別な一品を見る ↗</a>' : ''}</div><div class="collection-progress-detail"><label for="collection-progress"><strong>${count} <small>/ ${total}種類</small></strong><span>累計 ${M.money(s.totalSpent)}（架空）</span></label><progress id="collection-progress" max="${total}" value="${count}">${count} / ${total}</progress><a class="text-link" href="${M.summaryShareURL()}" target="_blank" rel="noopener noreferrer">ここまでの無駄遣いをXで共有 ↗</a></div></section>`;
  }
  function renderInvitation(s) {
    const section = document.getElementById('private-collection');
    if (!section) return;
    section.hidden = !M.specialUnlocked(s);
    if (section.hidden) { section.innerHTML = ''; return; }
    const p = M.products.find(p => p.secret);
    section.innerHTML = `<div class="invitation-copy"><p class="eyebrow">A PRIVATE OFFER FOR OUR MOST VALUED CUSTOMER</p><h2>お得意様への<br>特別なご案内です。</h2><p>通常の9品をお選びくださったあなたへ。<br>弊社が最後にご用意したのは、<br>あなた自身の徒労でございます。</p><span class="subtle">この一品の購入で、完全クリアとなります。</span></div><div class="private-product">${M.card(p, M.products.indexOf(p), true)}</div>`;
  }
  document.addEventListener('click', async e => {
    const button = e.target.closest('[data-download-completion]');
    if (!button) return;
    button.disabled = true;
    try { await M.downloadCompletion(); M.toast('心より、御礼申し上げます。', '全商品購入の感謝状を保存しました。'); }
    catch (e) { M.toast('感謝状を保存できませんでした。', e.message); }
    finally { button.disabled = false; }
  });
  M.toast = (title, message = '') => {
    const toast = document.createElement('div'); toast.className = 'toast';
    const strong = document.createElement('strong'); strong.textContent = title; toast.append(strong);
    if (message) { const p = document.createElement('p'); p.textContent = message; toast.append(p); }
    document.getElementById('toast-region').append(toast);
    setTimeout(() => toast.remove(), 6500);
  };
  function update() {
    const s = M.state(), member = M.memberPlan(s);
    document.querySelectorAll('[data-profile-name]').forEach(el => { el.textContent = s.profile.name || 'お客様'; });
    const profileLink = document.querySelector('.header-profile');
    if (profileLink) { profileLink.title = member ? member.english + ' / ' + member.name : '未入会'; profileLink.setAttribute('aria-label', 'マイページ・' + (s.profile.name || 'お客様') + '・' + (member ? member.english + ' / ' + member.name : '未入会')); }
    const badge = document.querySelector('[data-profile-badge]');
    if (badge) { badge.src = 'assets/images/' + (member?.badge || 'insignia-0.svg'); badge.alt = member ? member.name + '・' + member.badgeDescription : '未入会・山形のない盾章'; }
    document.querySelectorAll('[data-balance]').forEach(el => el.textContent = M.money(s.balance));
    document.querySelectorAll('[data-stat]').forEach(el => el.textContent = el.dataset.stat === 'spent' ? M.money(s.totalSpent) : el.dataset.stat === 'count' ? s.history.length : M.honorProgress(s).count);
    document.querySelectorAll('[data-achievement-total]').forEach(el => el.textContent = M.honorProgress(s).total);
    document.querySelectorAll('[data-product-total]').forEach(el => el.textContent = M.visibleProducts(s).length);
    renderInvitation(s);
    document.querySelectorAll('[data-owned]').forEach(el => el.textContent = s.history.some(p => p.productId === el.dataset.owned) ? '✓ コレクション済み' : '未収集');
    document.querySelectorAll('[data-share-summary]').forEach(el => el.href = M.summaryShareURL());
    renderCollection(s);
    if (!M.persistent && !document.querySelector('.storage-warning')) {
      const warning = document.createElement('p'); warning.className = 'storage-warning'; warning.setAttribute('role', 'status');
      warning.textContent = M.corrupt ? '保存済みの記録を読み込めませんでした。元の記録は保護されています。現在は一時モードです。ショップの「すべての記録を削除」で初期化できます。' : 'ブラウザに保存できません。現在の記録はこのページを閉じると失われます。保存領域の空きとブラウザの設定をご確認ください。';
      document.querySelector('main').prepend(warning);
    } else if (M.persistent) document.querySelector('.storage-warning')?.remove();
  }
  document.getElementById('featured-products')?.insertAdjacentHTML('beforeend', M.products.slice(0, 3).map((p, i) => M.card(p, i)).join(''));
  window.addEventListener('muda:update', update); update();
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => { el.classList.add('will-reveal'); observer.observe(el); });
  }
})();
