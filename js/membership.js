(() => {
  const M = window.Muda, dialog = document.getElementById('member-dialog'), content = document.getElementById('member-dialog-content');
  function render() {
    const s = M.state(), current = M.plans.find(p => p.id === s.membership?.planId);
    document.getElementById('member-status').innerHTML = current ? `<div class="member-current-insignia">${M.badgeHTML(current)}</div><div><p class="eyebrow">YOUR SEAT IN THE SALON</p><h2>${current.english} / ${current.name}</h2><p>内職1往復 ${M.money(current.rate)}（架空） ／ 支払済み架空会費 ${M.money(s.membershipSpent)}</p></div><button class="text-link" id="leave-membership">退会する</button>` : '<div><p class="eyebrow">YOUR SEAT IN THE SALON</p><h2>お席は、空いております。</h2><p>未入会の内職単価は1往復10円です。架空の入会金で、内職の単価が上がります。</p></div>';
    document.getElementById('plans').innerHTML = M.plans.map(p => `<article class="plan-card ${current?.id === p.id ? 'selected' : ''}"><div class="plan-insignia">${M.badgeHTML(p)}</div><p class="eyebrow">${p.english}</p><h2>${p.name}</h2><p class="plan-tagline">${p.tagline}</p><div class="plan-price">${M.money(p.fee)}<small>架空の入会金・実際の請求なし</small></div><ul><li>入会条件：異なる商品を${p.requiredProducts}種類購入</li><li>購入済み ${Math.min(M.joinQuote(p.id, s).purchased, p.requiredProducts)} / ${p.requiredProducts}種類</li><li>会員肩書きの表示</li><li>昇格時は最高到達ランクとの差額のみ</li><li>個人情報の登録なし</li></ul><div class="member-benefit"><span>封筒1往復の報酬</span><p><strong>${M.money(p.rate)}</strong>（架空）</p><small>閉じて剥がすと、元どおり。単価だけは上がります。</small></div><button class="button ${p.id === 'gold' ? 'gold' : 'outline'} full" data-join="${p.id}" ${current?.id === p.id ? 'disabled' : ''}>${current?.id === p.id ? '現在のプラン' : !M.joinQuote(p.id, s).eligible ? '入会条件を確認する ↗' : current ? 'このプランに変更する ↗' : 'このプランに入会する ↗'}</button></article>`).join('');
  }
  const close = () => dialog.close();
  dialog.querySelector('.dialog-close').onclick = close;
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  document.addEventListener('click', e => {
    const join = e.target.closest('[data-join]'), leave = e.target.closest('#leave-membership');
    if (!join && !leave) return;
    const plan = join && M.plans.find(p => p.id === join.dataset.join);
    if (join && !plan) return;
    const q = plan && M.joinQuote(plan.id);
    content.innerHTML = `<p class="eyebrow">MEMBERSHIP SIMULATION</p><h2 id="member-dialog-title">${leave ? 'サロンを退会しますか。' : `${plan.english} / ${plan.name}へ、ようこそ。`}</h2><p class="success-message">${leave ? '退会後の内職単価は1往復10円になります。所持金・購入履歴・実績はそのまま残ります。返金はありません。最高到達ランクまでは追加会費なしで再入会できます。' : `今回の架空会費：${M.money(q.cost)}。所持金 ${M.money(q.balance)} → ${q.affordable ? M.money(q.after) : '資金不足'}。実際の契約・請求・自動更新はありません。報酬は入会・変更後すぐに適用されます。`}</p>${q && !q.eligible ? `<p>入会条件：異なる商品を${q.required}種類購入（現在${q.purchased}種類）。あと${q.required - q.purchased}種類の購入が必要です。</p><a class="text-link" href="shop.html">商品を選ぶ ↗</a>` : ''}${q && !q.affordable ? `<p>あと${M.money(q.cost - q.balance)}の架空資金が必要です。</p><a class="text-link" href="earn.html">内職で資金をつくる ↗</a>` : ''}<button class="button gold full" id="confirm-membership" ${q && !q.canJoin ? 'disabled' : ''}>${leave ? '退会する' : `${M.money(q.cost)}（架空）で確定する`}</button><button class="cancel-button" id="cancel-membership">キャンセル</button>`;
    document.body.classList.add('modal-open'); dialog.showModal();
    document.getElementById('cancel-membership').onclick = close;
    document.getElementById('confirm-membership').onclick = () => {
      try { leave ? M.leave() : M.join(plan.id, q.cost); close(); M.toast(leave ? '退会のお手続きが完了しました。' : `${plan.english} / ${plan.name}としてお迎えいたします。`, '実際の契約・請求はありません。'); }
      catch (e) { M.toast('お手続きを完了できませんでした。', e.message); }
    };
  });
  render(); window.addEventListener('muda:update', render);
})();
