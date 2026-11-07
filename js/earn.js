(() => {
  'use strict';
  const M = window.Muda, envelope = document.getElementById('envelope-action'), sound = M.paperSound;
  let job = 'restore', sortingTaps = 0;
  const currentPhase = () => job === 'sort' ? M.state().sortingPhase : M.state().workPhase;
  let gesture = null, keyboard = null, keyboardTimer = null;
  function render() {
    const s = M.state();
    if (job === 'sort' && !M.canSort(s)) { cancelInput(); job = 'restore'; }
    const sorting = job === 'sort', phase = sorting ? s.sortingPhase : s.workPhase, sealed = ['peel', 'scatter'].includes(phase);
    document.getElementById('manual-restore').hidden = sorting;
    document.getElementById('manual-sort').hidden = !sorting;
    document.getElementById('earn-heading').textContent = sorting ? '揃えて、散らして、元どおり。' : '閉じて、剥がして、元どおり。';
    document.getElementById('earn-introduction').textContent = sorting ? 'ばらばらの封筒を、丁寧にひと束へ。そして、丁寧に散らす。整列の成果を残さないお仕事です。' : '空の封筒に糊を塗り、丁寧に封をする。そして、丁寧に剥がす。それが、弊社のお仕事です。';
    document.getElementById('work-rate-description').textContent = sorting ? '揃えて、散らして、元どおり。黒封筒は出ず、1往復の完了で報酬が入ります。' : '糊で閉じて、剥がして、元どおり。完了時の会員ランクで単価が決まります。';
    document.getElementById('sorting-pay-explanation').textContent = (s.lap === 2 ? '2周目は基本単価150円の1.5倍、1往復225円です。' : '基本単価は1往復150円です。') + '報酬はBLACK会員の実績にも加算します。すべて架空の報酬です。';
    document.getElementById('job-sort').disabled = !M.canSort(s);
    for (const id of ['restore', 'sort']) { const button = document.getElementById('job-' + id); button.setAttribute('aria-pressed', String(job === id)); button.className = 'button ' + (job === id ? 'gold' : 'outline'); }
    document.getElementById('sort-access').textContent = M.canSort(s) ? '封筒整列係をご利用いただけます。切り替えても作業途中の状態は保存されます。' : '封筒整列係は現在BLACK会員の方にご案内します。';
    document.getElementById('keyboard-work-help').textContent = sorting ? '封筒を3回クリック・タップして揃え、下へフリックして散らします。キーボードではEnterまたはSpaceを3回押して離し、↓を長押しして離してください。' : 'マウス・指でなぞって操作します。クリック・タップだけでは進みません。キーボードでは作業台を選び、前半は→、後半は↑を長押しして離してください。';
    if (phase !== 'align') sortingTaps = 0;
    restoreProgress();
    document.getElementById('work-title').textContent = sorting ? '封筒整列係。' : '封筒復元係。';
    document.getElementById('work-lap-note').textContent = s.lap === 2 ? (sorting ? '第二期・徒労の継承 ／ 整列係の報酬も1.5倍、1往復225円です。' : '第二期・徒労の継承 ／ 通常報酬1.5倍。黒封筒は500円のままです。') : '第一期・徒労のはじまり';
    envelope.dataset.job = job;
    envelope.setAttribute('aria-label', sorting ? '封筒整列の作業台。3回タップして揃え、下へフリックして散らす' : '封筒復元の作業台。右へ糊付け、上へ開封');
    document.getElementById('gesture-hint').textContent = sorting ? '3回タップして揃え、下へフリックして散らします。' : '右へなぞって糊付けし、上へ引き上げて開封します。';
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
    document.getElementById('work-direction').innerHTML = sorting ? `${sealed ? '下へフリックして、また散らす' : `3回タップして、束に揃える（${sortingTaps} / 3）`} <span>${sealed ? '↓' : '⋯'}</span><small>1往復の完了で + ${M.money(M.sortingReward(s))}</small>` : sealed ? `上へ引き上げて、元に戻す <span>↑</span><small>完了で + ${M.money(M.workReward(s))}</small>` : `右へなぞって、糊を塗る <span>→</span><small>1往復の完了で + ${M.money(M.workReward(s))}</small>`;
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
      document.getElementById('work-result').textContent = r.amount ? `${job === 'sort' ? 'またばらばらになりました。整列の成果は残りません。' : r.envelope === 'black' ? '黒封筒のお仕事を完了しました。' : '元どおりになりました。何も進んでいません。'} + ${M.money(r.amount)}（架空）` : job === 'sort' ? 'きれいに揃いました。次は下へフリックして散らしてください。' : 'しっかり閉じました。次は、上へ引き上げて糊を剥がしてください。';
      M.notifyAchievements(r.newly);
      if (r.invitationNow) M.toast('お得意様への特別なご案内です。', '通常8実績と通常9品が揃いました。商品一覧で最後の一品をご覧ください。');
      return r;
    } catch (e) { M.toast('作業手順をご確認ください。', e.message); render(); }
  }
  function progressFor(g, x, y) {
    const dx = x - g.x, dy = y - g.y;
    const distance = g.phase === 'seal' ? dx : g.phase === 'scatter' ? dy : -dy;
    const sideways = ['seal', 'align'].includes(g.phase) ? Math.abs(dy) : Math.abs(dx);
    if (distance <= 0 || sideways > Math.max(18, distance * 0.8)) return 0;
    const required = ['seal', 'align'].includes(g.phase) ? g.width * .45 : g.height * .35;
    return Math.max(0, Math.min(1, distance / required));
  }
  function setProgress(progress, previous, phase) {
    envelope.style.setProperty('--gesture-progress', progress);
    if (['seal', 'align'].includes(phase) && progress > previous + 0.025) sound?.rub();
  }
  function restoreProgress() {
    if (job === 'sort' && currentPhase() === 'align') envelope.style.setProperty('--gesture-progress', sortingTaps / 3);
    else envelope.style.removeProperty('--gesture-progress');
  }
  function tapToAlign() {
    if (job !== 'sort' || currentPhase() !== 'align' || !M.canSort()) return;
    void sound?.unlock(); sound?.rub(); sortingTaps++;
    if (sortingTaps === 3) {
      sortingTaps = 0;
      if (!act('align')) sortingTaps = 2;
    }
    render();
  }
  function clearKeyboard() {
    keyboard = null;
    if (keyboardTimer !== null) { clearInterval(keyboardTimer); keyboardTimer = null; }
    restoreProgress();
  }
  envelope.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0 || gesture) return;
    clearKeyboard();
    const rect = envelope.getBoundingClientRect();
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, phase: currentPhase(), width: rect.width, height: rect.height, progress: 0, maxTravel: 0 };
    envelope.focus({ preventScroll: true }); envelope.setPointerCapture(e.pointerId);
    void sound?.unlock();
  });
  envelope.addEventListener('pointermove', e => {
    if (!gesture || gesture.id !== e.pointerId) return;
    gesture.maxTravel = Math.max(gesture.maxTravel, Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y));
    if (gesture.phase === 'align') return;
    const next = progressFor(gesture, e.clientX, e.clientY);
    setProgress(next, gesture.progress, gesture.phase); gesture.progress = next;
  });
  function release(e, canceled = false) {
    if (!gesture || gesture.id !== e.pointerId) return;
    const g = gesture, progress = progressFor(g, e.clientX, e.clientY);
    gesture = null;
    if (envelope.hasPointerCapture(e.pointerId)) envelope.releasePointerCapture(e.pointerId);
    envelope.style.removeProperty('--gesture-progress');
    if (canceled || currentPhase() !== g.phase) return;
    if (g.phase === 'align') {
      if (Math.max(g.maxTravel, Math.hypot(e.clientX - g.x, e.clientY - g.y)) <= 12) tapToAlign();
    } else if (progress >= 1) act(g.phase);
  }
  envelope.addEventListener('pointerup', e => release(e));
  envelope.addEventListener('pointercancel', e => release(e, true));
  envelope.addEventListener('lostpointercapture', () => { gesture = null; envelope.style.removeProperty('--gesture-progress'); });
  // Directional long holds are a keyboard equivalent of dragging, not a click shortcut.
  envelope.addEventListener('keydown', e => {
    if (['Enter', ' '].includes(e.key)) {
      e.preventDefault();
      if (job === 'sort' && currentPhase() === 'align' && !e.repeat && !keyboard && !gesture) keyboard = { key: e.key, phase: 'align', tap: true };
      return;
    }
    const phase = currentPhase(), expected = phase === 'seal' ? 'ArrowRight' : phase === 'scatter' ? 'ArrowDown' : 'ArrowUp';
    if (!['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    if (e.key !== expected) { clearKeyboard(); return; }
    if (phase === 'align' || gesture || keyboard || e.repeat) return;
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
    if (k.tap) { if (currentPhase() === 'align') tapToAlign(); return; }
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
