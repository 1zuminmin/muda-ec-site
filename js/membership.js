(() => {
  const M = window.Muda, dialog = document.getElementById('member-dialog'), content = document.getElementById('member-dialog-content');
  function render() {
    const s = M.state(), current = M.plans.find(p => p.id === s.membership?.planId);
    document.getElementById('member-status').innerHTML = current ? `<div class="member-current-insignia">${M.badgeHTML(current)}</div><div><p class="eyebrow">YOUR SEAT IN THE SALON</p><h2>${current.english} / ${current.name}</h2><p>内職1往復 ${M.money(current.rate)}（架空） ／ 無料体験会員</p></div><button class="text-link" id="leave-membership">退会する</button>` : '<div><p class="eyebrow">YOUR SEAT IN THE SALON</p><h2>お席は、空いております。</h2><p>未入会の内職単価は1往復10円です。どのプランも無料でお試しいただけます。</p></div>';
    document.getElementById('plans').innerHTML = M.plans.map(p => `<article class="plan-card ${current?.id === p.id ? 'selected' : ''}"><div class="plan-insignia">${M.badgeHTML(p)}</div><p class="eyebrow">${p.english}</p><h2>${p.name}</h2><p class="plan-tagline">${p.tagline}</p><div class="plan-price">¥0<small>無料体験・請求なし</small></div><ul><li>会員肩書きの表示</li><li>いつでも無料でプラン変更・退会</li><li>個人情報の登録なし</li></ul><div class="member-benefit"><span>封筒1往復の報酬</span><p><strong>${M.money(p.rate)}</strong>（架空）</p><small>閉じて剥がすと、元どおり。単価だけは上がります。</small></div><button class="button ${p.id === 'gold' ? 'gold' : 'outline'} full" data-join="${p.id}" ${current?.id === p.id ? 'disabled' : ''}>${current?.id === p.id ? '現在のプラン' : current ? 'このプランに変更する ↗' : '無料で入会する ↗'}</button></article>`).join('');
  }
  const close = () => dialog.close();
  dialog.querySelector('.dialog-close').onclick = close;
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  document.addEventListener('click', e => {
    const join = e.target.closest('[data-join]'), leave = e.target.closest('#leave-membership');
    if (!join && !leave) return;
    const plan = join && M.plans.find(p => p.id === join.dataset.join);
    if (join && !plan) return;
    content.innerHTML = `<p class="eyebrow">MEMBERSHIP SIMULATION</p><h2 id="member-dialog-title">${leave ? 'サロンを退会しますか。' : `${plan.english} / ${plan.name}へ、ようこそ。`}</h2><p class="success-message">${leave ? '退会後の内職単価は1往復10円になります。所持金・購入履歴・実績はそのまま残ります。いつでも無料で再入会できます。' : '無料の入会体験です。実際のサブスクリプション契約・請求・自動更新はありません。封筒を閉じて剥がす1往復の報酬は、入会・変更後すぐに適用されます。'}</p><button class="button gold full" id="confirm-membership">${leave ? '無料体験を退会する' : M.state().membership ? '無料でプランを変更する' : '無料体験に入会する'}</button><button class="cancel-button" id="cancel-membership">キャンセル</button>`;
    document.body.classList.add('modal-open'); dialog.showModal();
    document.getElementById('cancel-membership').onclick = close;
    document.getElementById('confirm-membership').onclick = () => {
      try { leave ? M.leave() : M.join(plan.id); close(); M.toast(leave ? '退会のお手続きが完了しました。' : `${plan.english} / ${plan.name}としてお迎えいたします。`, '実際の契約・請求はありません。'); }
      catch (e) { M.toast('お手続きを完了できませんでした。', e.message); }
    };
  });
  render(); window.addEventListener('muda:update', render);
})();
