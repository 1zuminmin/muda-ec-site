(() => {
  'use strict';
  const M = window.Muda, form = document.getElementById('dice-form'), result = document.getElementById('dice-result');
  let rolling = false;
  function render() {
    const s = M.state();
    document.getElementById('work-count').textContent = s.workCount.toLocaleString('ja-JP');
    document.getElementById('work-earned').textContent = M.money(s.earnedTotal);
    document.getElementById('dice-history').innerHTML = s.rounds.length ? `<div class="round-list">${s.rounds.map(r => `<div class="round-row"><time datetime="${r.date}">${new Date(r.date).toLocaleString('ja-JP')}</time><span>${r.choice === 'cho' ? '丁' : '半'}に ${M.money(r.stake)}</span><span>${r.die1} + ${r.die2} = ${r.die1 + r.die2}</span><strong class="${r.won ? 'win' : 'loss'}">${r.won ? '+' : '−'}${M.money(r.stake)}</strong></div>`).join('')}</div>` : '<div class="quiet-empty">まだ、運を試していません。内職だけでもお楽しみいただけます。</div>';
  }
  document.getElementById('work-button').addEventListener('click', () => {
    try {
      const r = M.work(); if (!r) return;
      document.getElementById('work-result').textContent = `一通、完成いたしました。 + ${M.money(r.amount)}（架空）`;
      const envelope = document.querySelector('.envelope');
      envelope.classList.remove('stamped'); void envelope.offsetWidth; envelope.classList.add('stamped');
      M.notifyAchievements(r.newly);
    } catch (e) { M.toast('作業を完了できませんでした。', e.message); }
  });
  function showRound(r) {
    if (!r) return;
    document.getElementById('die-one').textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][r.die1 - 1];
    document.getElementById('die-one').setAttribute('aria-label', `一つ目 ${r.die1}`);
    document.getElementById('die-two').textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][r.die2 - 1];
    document.getElementById('die-two').setAttribute('aria-label', `二つ目 ${r.die2}`);
    const parity = (r.die1 + r.die2) % 2 === 0 ? '丁' : '半';
    result.className = 'dice-result ' + (r.won ? 'win' : 'loss');
    result.textContent = `${r.die1} + ${r.die2} = ${r.die1 + r.die2}、${parity}。${r.won ? `的中です。${M.money(r.stake * 2)}を受け取り、差し引き +${M.money(r.stake)}。` : `残念。${M.money(r.stake)}の掛け金は戻りません。`}（すべて架空）`;
  }
  form.addEventListener('submit', async e => {
    e.preventDefault(); if (rolling) return;
    try {
      const stake = Number(document.getElementById('stake').value), choice = new FormData(form).get('choice');
      M.startRound(stake, choice);
      rolling = true; [...form.elements].forEach(el => el.disabled = true);
      document.getElementById('dice-stage').classList.add('rolling');
      result.textContent = 'さいころを、丁寧に転がしております。';
      await new Promise(resolve => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 1000));
      showRound(M.settleRound());
    } catch (e) { result.textContent = e.message; }
    finally { rolling = false; [...form.elements].forEach(el => el.disabled = false); document.getElementById('dice-stage').classList.remove('rolling'); }
  });
  // A committed round survives navigation/reload and is settled exactly once.
  const pending = M.state().pendingRound;
  if (pending) showRound(M.settleRound());
  else if (M.state().rounds.length) showRound(M.state().rounds[0]);
  render(); window.addEventListener('muda:update', render);
})();
