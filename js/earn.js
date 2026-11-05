(() => {
  'use strict';
  const M = window.Muda, envelope = document.getElementById('envelope-action');
  let gesture = null, suppressClick = false;
  function render() {
    const s = M.state(), sealed = s.workPhase === 'peel';
    document.getElementById('work-count').textContent = s.workCount.toLocaleString('ja-JP');
    document.getElementById('work-earned').textContent = M.money(s.earnedTotal);
    document.getElementById('work-rate').textContent = M.money(M.workRate(s));
    document.getElementById('work-plan').textContent = M.plans.find(p => p.id === s.membership?.planId)?.name || '未入会';
    document.getElementById('work-phase').textContent = sealed ? '02 / PEEL' : '01 / SEAL';
    document.getElementById('work-instruction').textContent = sealed ? '今の糊を、丁寧に剥がしてください。' : '糊を塗って、封をしてください。';
    document.getElementById('gesture-hint').textContent = sealed ? '封筒を上へなぞるか、もう一度タップしてください。' : '封筒を右へなぞるか、タップしてください。';
    envelope.dataset.phase = s.workPhase;
    envelope.setAttribute('aria-label', sealed ? '封筒の糊を剥がして報酬を受け取る' : '封筒に糊を塗って閉じる');
    document.getElementById('work-button').innerHTML = sealed ? `糊を剥がして元に戻す <span>+ ${M.money(M.workRate(s))}</span>` : '糊を塗って封をする <span>01 / 02</span>';
  }
  function act(phase = M.state().workPhase) {
    try {
      const r = M.workStep(phase); if (!r) return;
      document.getElementById('work-result').textContent = r.amount ? `元どおりになりました。何も進んでいません。 + ${M.money(r.amount)}（架空）` : 'しっかり閉じました。次は、その糊を剥がしてください。';
      M.notifyAchievements(r.newly);
    } catch (e) { M.toast('作業手順をご確認ください。', e.message); render(); }
  }
  document.getElementById('work-button').addEventListener('click', () => act());
  envelope.addEventListener('click', e => {
    if (e.detail !== 0 && suppressClick) { suppressClick = false; return; }
    act();
  });
  envelope.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0 || gesture) return;
    suppressClick = false;
    const rect = envelope.getBoundingClientRect();
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, phase: M.state().workPhase, width: rect.width, height: rect.height, progress: 0 };
    envelope.setPointerCapture(e.pointerId);
  });
  envelope.addEventListener('pointermove', e => {
    if (!gesture || gesture.id !== e.pointerId) return;
    const distance = gesture.phase === 'seal' ? e.clientX - gesture.x : gesture.y - e.clientY;
    const required = gesture.phase === 'seal' ? gesture.width * .45 : gesture.height * .35;
    gesture.progress = Math.max(0, Math.min(1, distance / required));
    envelope.style.setProperty('--gesture-progress', gesture.progress);
  });
  function release(e, canceled = false) {
    if (!gesture || gesture.id !== e.pointerId) return;
    const g = gesture, movement = Math.hypot(e.clientX - g.x, e.clientY - g.y);
    gesture = null;
    if (envelope.hasPointerCapture(e.pointerId)) envelope.releasePointerCapture(e.pointerId);
    envelope.style.removeProperty('--gesture-progress');
    if (canceled) { suppressClick = true; return; }
    if (movement >= 12) {
      suppressClick = true;
      if (g.progress >= 1 && M.state().workPhase === g.phase) act(g.phase);
    }
    // Short movements are handled by the native click event (tap or keyboard).
  }
  envelope.addEventListener('pointerup', e => release(e));
  envelope.addEventListener('pointercancel', e => release(e, true));
  envelope.addEventListener('lostpointercapture', () => { gesture = null; envelope.style.removeProperty('--gesture-progress'); });
  render(); window.addEventListener('muda:update', render);
})();
