(() => {
  'use strict';
  const M = window.Muda, input = document.getElementById('profile-name'), feedback = document.getElementById('profile-feedback');
  let draftDirty = false;
  function preview() {
    const name = input.value.normalize('NFC').trim().replace(/\s+/gu, ' '), count = M.nameLength(name);
    document.getElementById('profile-name-count').textContent = `${count} / 20文字`;
    document.getElementById('certificate-name-preview').textContent = `${name || '名もなき浪費家'} 様`;
    input.setCustomValidity(count > 20 ? 'お名前は20文字以内で入力してください。' : '');
    input.setAttribute('aria-invalid', count > 20 ? 'true' : 'false');
  }
  function render() {
    const s = M.state(), plan = M.memberPlan(s), latest = s.history.at(-1);
    document.getElementById('profile-display-name').textContent = M.recipientName(s);
    document.getElementById('profile-rank').textContent = plan ? `${plan.english} / ${plan.name}` : '未入会';
    document.getElementById('profile-insignia').innerHTML = M.badgeHTML(plan);
    document.getElementById('profile-insignia-description').textContent = plan?.badgeDescription || '山形のない盾章';
    document.getElementById('profile-spent').textContent = M.money(s.totalSpent);
    document.getElementById('profile-work-rate').textContent = M.money(M.workRate(s));
    document.getElementById('profile-collection').textContent = `${new Set(s.history.map(p => p.productId)).size} / ${M.visibleProducts(s).length}種類`;
    document.getElementById('save-latest-certificate').hidden = !latest;
    document.getElementById('certificate-availability').textContent = latest ? '保存済みのお名前で、最新の購入認定証を再発行できます。完全クリア後は、ページ下部で感謝状も保存できます。' : '商品を購入すると、お名前入りの認定証を保存できます。';
    if (!draftDirty) { input.value = s.profile.name; preview(); }
  }
  input.addEventListener('input', () => { draftDirty = true; preview(); feedback.textContent = 'まだ保存していません。保存ボタンで賞状の宛名に反映します。'; });
  document.getElementById('profile-form').addEventListener('submit', e => {
    e.preventDefault();
    try {
      const name = M.setName(input.value);
      draftDirty = false; input.value = name; preview();
      feedback.textContent = name ? 'お名前を保存しました。これから保存する賞状に反映されます。' : 'お名前を解除しました。賞状の宛名は「名もなき浪費家 様」になります。';
      M.toast(name ? 'お名前を台帳にお預かりしました。' : 'お名前を解除しました。');
    } catch (error) { feedback.textContent = error.message; input.setAttribute('aria-invalid', 'true'); }
  });
  document.getElementById('save-latest-certificate').addEventListener('click', async e => {
    const purchase = M.state().history.at(-1); if (!purchase) return;
    const button = e.currentTarget; button.disabled = true;
    try { await M.downloadCertificate(purchase); M.toast('お名前入りの認定証を保存しました。'); }
    catch (error) { M.toast('認定証を保存できませんでした。', error.message); }
    finally { button.disabled = false; }
  });
  render(); window.addEventListener('muda:update', render);
})();
