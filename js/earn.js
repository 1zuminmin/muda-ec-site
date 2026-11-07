(() => {
  'use strict';
  const M = window.Muda, envelope = document.getElementById('envelope-action'), sound = M.paperSound;
  let job = 'restore';
  const currentPhase = () => job === 'sort' ? M.state().sortingPhase : M.state().workPhase;
  let gesture = null, keyboard = null, keyboardTimer = null;
  function render() {
    const s = M.state();
    if (job === 'sort' && !M.canSort(s)) { cancelInput(); job = 'restore'; }
    const sorting = job === 'sort', phase = sorting ? s.sortingPhase : s.workPhase, sealed = ['peel', 'scatter'].includes(phase);
    document.getElementById('job-sort').disabled = !M.canSort(s);
    for (const id of ['restore', 'sort']) { const button = document.getElementById('job-' + id); button.setAttribute('aria-pressed', String(job === id)); button.className = 'button ' + (job === id ? 'gold' : 'outline'); }
    document.getElementById('sort-access').textContent = M.canSort(s) ? '封筒整列係をご利用いただけます。切り替えても作業途中の状態は保存されます。' : '封筒整列係は現在BLACK会員の方にご案内します。';
    document.getElementById('work-title').textContent = sorting ? '封筒整列係。' : '封筒復元係。';
    document.getElementById('work-lap-note').textContent = s.lap === 2 ? '第二期・徒労の継承 ／ 通常報酬1.5倍。黒封筒は500円のままです。' : '第一期・徒労のはじまり';
    envelope.dataset.job = job;
    envelope.setAttribute('aria-label', sorting ? '封筒整列の作業台。右へ揃え、上へ散らす' : '封筒復元の作業台。右へ糊付け、上へ開封');
    document.getElementById('gesture-hint').textContent = sorting ? '右へなぞって揃え、上へ引き上げて散らします。' : '右へなぞって糊付けし、上へ引き上げて開封します。';
    document.getElementById('work-count').textContent = s.workCount.toLocaleString('ja-JP');
    document.getElementById('work-earned').textContent = M.money(s.earnedTotal);
    document.getElementById('work-rate').textContent = M.money(sorting ? M.sortingReward(s) : M.workRate(s));
    const plan = M.memberPlan(s);
    document.getElementById('work-plan').textContent = plan ? `${plan.english} / ${plan.name}` : '未入会';
    document.getElementById('work-phase').textContent = sorting ? (sealed ? '02 / SCATTER' : '01 / ALIGN') : (sealed ? '02 / PEEL' : '01 / SEAL');
    document.getElementById('work-instruction').dataset.phase = phase;
    for (const id of ['seal', 'peel', 'align', 'scatter']) document.getElementById('work-copy-' + id).setAttribute('aria-hidden', String(id !== phase));
    document.getElementById('work-envelope-kind').textContent = sorting ? '整列専用の封筒 ／ 黒封筒なし' : s.workEnvelope === 'black' ? '特別依頼 ／ 黒封筒・1通500円' : '通常の封筒';
    envelope.dataset.phase = phase;
    envelope.dataset.kind = sorting ? 'normal' : s.workEnvelope;
    document.getElementById('work-direction').innerHTML = sorting ? `${sealed ? '上へ引き上げて、また散らす' : '右へなぞって、束に揃える'} <span>${sealed ? '↑' : '→'}</span><small>1往復の完了で + ${M.money(M.sortingReward(s))}</small>` : sealed ? `上へ引き上げて、元に戻す <span>↑</span><small>完了で + ${M.money(M.workReward(s))}</small>` : `右へなぞって、糊を塗る <span>→</span><small>1往復の完了で + ${M.money(M.workReward(s))}</small>`;
  }
  function soundControl() {
    const button = document.getElementById('paper-sound-toggle');
    button.disabled = !sound?.supported;
    button.setAttribute('aria-pressed', sound?.enabled ? 'true' : 'false');
    button.textContent = !sound?.supported ? '効果音 未対応' : sound.enabled ? '効果音 ON' : '効果音 OFF';
  }
  document.getElementById('paper-sound-toggle').addEventListener('click', () => { sound?.setEnabled(!sound.enabled); soundControl(); });
  function act(phase) {
    try {
      const r = job === 'sort' ? M.sortingStep(phase) : M.workStep(phase); if (!r) return;
      sound?.finish(['peel', 'scatter'].includes(phase) ? 'peel' : 'seal');
      if (job === 'restore' && r.amount && r.nextEnvelope === 'black') sound?.rare?.();
      document.getElementById('work-result').textContent = r.amount ? `${job === 'sort' ? 'またばらばらになりました。整列の成果は残りません。' : r.envelope === 'black' ? '黒封筒のお仕事を完了しました。' : '元どおりになりました。何も進んでいません。'} + ${M.money(r.amount)}（架空）` : job === 'sort' ? 'きれいに揃いました。次は上へ引き上げて散らしてください。' : 'しっかり閉じました。次は、上へ引き上げて糊を剥がしてください。';
      M.notifyAchievements(r.newly);
      if (r.invitationNow) M.toast('お得意様への特別なご案内です。', '通常8実績と通常9品が揃いました。商品一覧で最後の一品をご覧ください。');
    } catch (e) { M.toast('作業手順をご確認ください。', e.message); render(); }
  }
  function progressFor(g, x, y) {
    const dx = x - g.x, dy = y - g.y;
    const distance = ['seal', 'align'].includes(g.phase) ? dx : -dy;
    const sideways = ['seal', 'align'].includes(g.phase) ? Math.abs(dy) : Math.abs(dx);
    if (distance <= 0 || sideways > Math.max(18, distance * 0.8)) return 0;
    const required = ['seal', 'align'].includes(g.phase) ? g.width * .45 : g.height * .35;
    return Math.max(0, Math.min(1, distance / required));
  }
  function setProgress(progress, previous, phase) {
    envelope.style.setProperty('--gesture-progress', progress);
    if (['seal', 'align'].includes(phase) && progress > previous + 0.025) sound?.rub();
  }
  function clearKeyboard() {
    keyboard = null;
    if (keyboardTimer !== null) { clearInterval(keyboardTimer); keyboardTimer = null; }
    envelope.style.removeProperty('--gesture-progress');
  }
  envelope.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0 || gesture) return;
    clearKeyboard();
    const rect = envelope.getBoundingClientRect();
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, phase: currentPhase(), width: rect.width, height: rect.height, progress: 0 };
    envelope.focus({ preventScroll: true }); envelope.setPointerCapture(e.pointerId);
    void sound?.unlock();
  });
  envelope.addEventListener('pointermove', e => {
    if (!gesture || gesture.id !== e.pointerId) return;
    const next = progressFor(gesture, e.clientX, e.clientY);
    setProgress(next, gesture.progress, gesture.phase); gesture.progress = next;
  });
  function release(e, canceled = false) {
    if (!gesture || gesture.id !== e.pointerId) return;
    const g = gesture, progress = progressFor(g, e.clientX, e.clientY);
    gesture = null;
    if (envelope.hasPointerCapture(e.pointerId)) envelope.releasePointerCapture(e.pointerId);
    envelope.style.removeProperty('--gesture-progress');
    if (!canceled && progress >= 1 && currentPhase() === g.phase) act(g.phase);
  }
  envelope.addEventListener('pointerup', e => release(e));
  envelope.addEventListener('pointercancel', e => release(e, true));
  envelope.addEventListener('lostpointercapture', () => { gesture = null; envelope.style.removeProperty('--gesture-progress'); });
  // Directional long holds are a keyboard equivalent of dragging, not a click shortcut.
  envelope.addEventListener('keydown', e => {
    if (['Enter', ' '].includes(e.key)) { e.preventDefault(); return; }
    const phase = currentPhase(), expected = ['seal', 'align'].includes(phase) ? 'ArrowRight' : 'ArrowUp';
    if (!['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    if (e.key !== expected) { clearKeyboard(); return; }
    if (gesture || keyboard || e.repeat) return;
    keyboard = { key: e.key, phase, since: Date.now(), progress: 0 };
    void sound?.unlock();
    keyboardTimer = setInterval(() => {
      if (!keyboard) return;
      const next = Math.min(1, (Date.now() - keyboard.since) / 700);
      setProgress(next, keyboard.progress, keyboard.phase); keyboard.progress = next;
    }, 35);
  });
  envelope.addEventListener('keyup', e => {
    if (!keyboard || keyboard.key !== e.key) return;
    e.preventDefault(); const k = keyboard; clearKeyboard();
    if (Date.now() - k.since >= 700 && currentPhase() === k.phase) act(k.phase);
  });
  function cancelInput() {
    const id = gesture?.id; gesture = null; clearKeyboard();
    if (id !== undefined && envelope.hasPointerCapture(id)) envelope.releasePointerCapture(id);
  }
  envelope.addEventListener('blur', cancelInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelInput(); });
  window.addEventListener('blur', cancelInput);
  for (const id of ['restore', 'sort']) document.getElementById('job-' + id).addEventListener('click', () => {
    if (id === 'sort' && !M.canSort()) return;
    cancelInput(); job = id; document.getElementById('work-result').textContent = id === 'sort' ? '揃えて、散らして、元どおり。1往復で報酬が発生します。' : '閉じてから剥がすと、1往復分の報酬が発生します。'; render();
  });
  soundControl(); render(); window.addEventListener('muda:update', render);
})();
