(() => {
  'use strict';
  const M = window.Muda, dialog = document.getElementById('purchase-dialog'), content = document.getElementById('dialog-content');
  let busy = false;
  const productList = document.getElementById('shop-products');
  if (productList) productList.innerHTML = M.regularProducts.map((p, i) => M.card(p, i, true)).join('');
  const open = () => { if (!dialog.open) dialog.showModal(); document.body.classList.add('modal-open'); };
  const close = () => { if (!busy) dialog.close(); };
  dialog.querySelector('.dialog-close').addEventListener('click', close);
  dialog.addEventListener('cancel', e => { if (busy) e.preventDefault(); });
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); content.innerHTML = ''; });
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); } });
  function confirmation(p) {
    const s = M.state(), enough = s.balance >= p.price;
    content.innerHTML = `<p class="eyebrow">A CONSIDERED WASTE</p><h2 id="dialog-title">この無駄を、あなたに。</h2><img class="dialog-product" src="assets/images/${p.image}" alt="${p.name}"><h3>${p.name}</h3><div class="receipt"><div><span>架空購入金額</span><strong>${M.money(p.price)}</strong></div><div><span>現在の所持金</span><span>${M.money(s.balance)}</span></div><div><span>購入後の所持金</span><span>${enough ? M.money(s.balance - p.price) : '所持金が不足しています'}</span></div></div><p class="dialog-note">無料のシミュレーションです。実際の支払いはありません。</p><button class="button gold full" id="confirm-purchase" ${enough ? '' : 'disabled'}>${enough ? 'この内容で架空購入する' : '架空の所持金が不足しています'} <span>↗</span></button><button class="cancel-button" id="cancel-purchase">もう少し考える</button>`;
    if (!enough) content.insertAdjacentHTML('beforeend', '<a class="text-link" href="earn.html">内職で資金をつくる ↗</a>');
    open();
    document.getElementById('cancel-purchase').onclick = close;
    document.getElementById('confirm-purchase').onclick = () => purchase(p);
  }
  async function purchase(p) {
    if (busy) return;
    busy = true; dialog.querySelector('.dialog-close').disabled = true;
    content.innerHTML = '<div class="processing" role="status"><div class="loader"></div><p class="eyebrow">TRANSFORMING YOUR ASSETS</p><h2 id="dialog-title" tabindex="-1">無意味へ、変換中。</h2><p>お客様の架空の資産を丁寧に無駄にしております。</p></div>';
    document.getElementById('dialog-title').focus();
    await new Promise(resolve => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 1100));
    try {
      const result = M.buy(p.id);
      content.innerHTML = `<div class="success-seal" aria-hidden="true">✓</div><p class="eyebrow">A PERFECTLY USELESS PURCHASE</p><h2 id="dialog-title" tabindex="-1">見事な無駄遣いです。</h2><p class="success-message">この度は弊社の商品をお買い上げいただき、誠にありがとうございます。お客様の架空の資産が、何の役にも立たないものへと変換されましたことを心よりお祝い申し上げます。</p><blockquote>${p.message}</blockquote><div class="receipt"><div><span>${p.name}</span><strong>${M.money(p.price)} <small>架空</small></strong></div></div><p class="dialog-note">架空の購入・実際の支払いなし</p><button class="button gold full" id="download-certificate">無駄遣い認定証を保存する ↓</button><a class="button outline full share-link" href="${M.shareURL(result.purchase)}" target="_blank" rel="noopener noreferrer">Xでこの無駄を共有 ↗</a><button class="cancel-button" id="continue-shopping">お買い物を続ける</button><p class="fine">認定証はPNG形式です。Xへの画像添付は手動で行ってください。</p>`;
      if (result.invitationNow) content.insertAdjacentHTML('afterbegin', '<div class="completion-announcement"><p class="eyebrow">A PRIVATE INVITATION</p><p>お得意様への特別なご案内です。</p><p>通常9品のお買い上げに感謝を込めて、最後の一品をご用意いたしました。</p><a class="text-link" href="shop.html#private-collection">特別なご案内を開く ↗</a></div>');
      if (result.completedNow) content.insertAdjacentHTML('afterbegin', `<div class="completion-announcement"><p class="eyebrow">COMPLETE, AT LAST</p><p>${M.completionText}</p><button class="text-link" data-download-completion>完全クリアの感謝状を保存 ↓</button></div>`);
      document.getElementById('download-certificate').onclick = () => download(result.purchase);
      document.getElementById('continue-shopping').onclick = close;
      M.notifyAchievements(result.newly);
    } catch (e) {
      content.innerHTML = '<h2 id="dialog-title" tabindex="-1">お手続きを完了できませんでした。</h2><p id="purchase-error" role="alert"></p><button class="button outline full" id="error-close">閉じる</button>';
      document.getElementById('purchase-error').textContent = e.message;
      document.getElementById('error-close').onclick = close;
    } finally { busy = false; dialog.querySelector('.dialog-close').disabled = false; document.getElementById('dialog-title').focus(); }
  }
  async function download(p) { try { await M.downloadCertificate(p); M.toast('認定証を発行しました。', 'PNG画像をダウンロードしました。'); } catch (e) { M.toast('認定証の保存に失敗しました。', e.message); } }
  function renderHistory() {
    const s = M.state(), container = document.getElementById('purchase-history');
    if (!container) return;
    if (!s.history.length) { container.innerHTML = '<div class="empty-state"><span aria-hidden="true">◇</span><h3>あなたの物語は、まだ白紙です。</h3><p>最初の無駄遣いを、心よりお待ちしております。</p></div>'; return; }
    container.innerHTML = `<div class="history-summary">${s.history.length.toLocaleString('ja-JP')} 点のご購入 ／ 累計 ${M.money(s.totalSpent)}（架空）</div><div class="history-list">${[...s.history].reverse().map(p => { const product = M.products.find(a => a.id === p.productId); return `<article class="history-row"><img src="assets/images/${product.image}" width="64" height="64" alt=""><div><h3>${product.name}</h3><p>${M.purchaseDate(p.date)} <span class="history-id">${p.id}</span></p></div><strong>${M.money(p.price)}<small>架空</small></strong><button class="text-link" data-certificate="${p.id}">認定証を保存 ↓</button><a class="text-link" href="${M.shareURL(p)}" target="_blank" rel="noopener noreferrer" aria-label="${product.name}の購入をXで共有">Xで共有 ↗</a></article>`; }).join('')}</div>`;
  }
  document.addEventListener('click', e => { const button = e.target.closest('[data-buy]'); if (button) { const p = M.products.find(p => p.id === button.dataset.buy); if (p) confirmation(p); } });
  document.getElementById('purchase-history')?.addEventListener('click', e => { const button = e.target.closest('[data-certificate]'); if (button) { const p = M.state().history.find(p => p.id === button.dataset.certificate); if (p) download(p); } });
  function manage(type) {
    const deleting = type === 'delete';
    content.innerHTML = `<p class="eyebrow">YOUR ACCOUNT</p><h2 id="dialog-title">${deleting ? 'すべての記録を削除しますか。' : '所持金をリセットしますか。'}</h2><p class="success-message">${deleting ? '購入履歴・累計額・内職・実績・会員状態・登録名・感謝状をすべて削除し、所持金を0円に戻します。この操作は取り消せません。' : '所持金を0円に戻します。購入・内職・実績・会員・感謝状の記録はそのまま残ります。'}</p><button class="button ${deleting ? 'danger' : 'gold'} full" id="confirm-management">${deleting ? 'すべての記録を削除する' : '所持金を0円に戻す'}</button><button class="cancel-button" id="cancel-management" autofocus>キャンセル</button>`;
    open(); document.getElementById('cancel-management').onclick = close;
    document.getElementById('confirm-management').onclick = () => { deleting ? M.clear() : M.resetBalance(); close(); M.toast(deleting ? 'すべての記録を削除しました。' : '架空の所持金を0円に戻しました。'); };
  }
  document.getElementById('reset-balance')?.addEventListener('click', () => manage('reset'));
  document.getElementById('delete-records')?.addEventListener('click', () => manage('delete'));
  window.dispatchEvent(new CustomEvent('muda:update', { detail: M.state() }));
  window.addEventListener('muda:update', renderHistory); renderHistory();
})();
