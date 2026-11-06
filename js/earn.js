(() => {
  'use strict';
  const M = window.Muda, envelope = document.getElementById('envelope-action'), sound = M.paperSound;
  let gesture = null, keyboard = null, keyboardTimer = null;
  function render() {
    const s = M.state(), sealed = s.workPhase === 'peel';
    document.getElementById('work-count').textContent = s.workCount.toLocaleString('ja-JP');
    document.getElementById('work-earned').textContent = M.money(s.earnedTotal);
    document.getElementById('work-rate').textContent = M.money(M.workRate(s));
    const plan = M.memberPlan(s);
    document.getElementById('work-plan').textContent = plan ? `${plan.english} / ${plan.name}` : '未入会';
    document.getElementById('work-phase').textContent = sealed ? '02 / PEEL' : '01 / SEAL';
    document.getElementById('work-instruction').textContent = sealed ? '今の糊を、上へ引き上げて剥がしてください。' : '右へなぞって、糊を塗ってください。';
    document.getElementById('gesture-hint').textContent = sealed ? '封筒に指を置き、上へ引き上げてから離してください。' : '封筒に指を置き、右へなぞってから離してください。';
    envelope.dataset.phase = s.workPhase;
    document.getElementById('work-direction').innerHTML = sealed ? `上へ引き上げて、元に戻す <span>↑</span><small>完了で + ${M.money(M.workRate(s))}</small>` : '右へなぞって、糊を塗る <span>→</span><small>まだ報酬は発生しません</small>';
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
      const r = M.workStep(phase); if (!r) return;
      sound?.finish(phase);
      document.getElementById('work-result').textContent = r.amount ? `元どおりになりました。何も進んでいません。 + ${M.money(r.amount)}（架空）` : 'しっかり閉じました。次は、上へ引き上げて糊を剥がしてください。';
      M.notifyAchievements(r.newly);
      if (r.invitationNow) M.toast('お得意様への特別なご案内です。', '通常8実績と通常9品が揃いました。商品一覧で最後の一品をご覧ください。');
    } catch (e) { M.toast('作業手順をご確認ください。', e.message); render(); }
  }
  function progressFor(g, x, y) {
    const dx = x - g.x, dy = y - g.y;
    const distance = g.phase === 'seal' ? dx : -dy;
    const sideways = g.phase === 'seal' ? Math.abs(dy) : Math.abs(dx);
    if (distance <= 0 || sideways > Math.max(18, distance * 0.8)) return 0;
    const required = g.phase === 'seal' ? g.width * .45 : g.height * .35;
    return Math.max(0, Math.min(1, distance / required));
  }
  function setProgress(progress, previous, phase) {
    envelope.style.setProperty('--gesture-progress', progress);
    if (phase === 'seal' && progress > previous + 0.025) sound?.rub();
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
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, phase: M.state().workPhase, width: rect.width, height: rect.height, progress: 0 };
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
    if (!canceled && progress >= 1 && M.state().workPhase === g.phase) act(g.phase);
  }
  envelope.addEventListener('pointerup', e => release(e));
  envelope.addEventListener('pointercancel', e => release(e, true));
  envelope.addEventListener('lostpointercapture', () => { gesture = null; envelope.style.removeProperty('--gesture-progress'); });
  // Directional long holds are a keyboard equivalent of dragging, not a click shortcut.
  envelope.addEventListener('keydown', e => {
    if (['Enter', ' '].includes(e.key)) { e.preventDefault(); return; }
    const phase = M.state().workPhase, expected = phase === 'seal' ? 'ArrowRight' : 'ArrowUp';
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
    if (Date.now() - k.since >= 700 && M.state().workPhase === k.phase) act(k.phase);
  });
  function cancelInput() {
    const id = gesture?.id; gesture = null; clearKeyboard();
    if (id !== undefined && envelope.hasPointerCapture(id)) envelope.releasePointerCapture(id);
  }
  envelope.addEventListener('blur', cancelInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelInput(); });
  window.addEventListener('blur', cancelInput);
  soundControl(); render(); window.addEventListener('muda:update', render);
})();
