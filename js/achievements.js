(() => {
  const M = window.Muda;
  const order = ['first', 'planned', 'collection', 'ultimate', 'complete', 'regular', 'red-worker', 'gold-worker', 'black-worker'];
  function render() {
    const s = M.state(), progress = M.honorProgress(s);
    document.getElementById('unlocked-count').textContent = progress.count;
    document.getElementById('overall-progress').max = progress.total;
    document.getElementById('overall-progress').value = progress.count;
    document.getElementById('overall-percent').textContent = Math.round(progress.count / progress.total * 100) + '%';
    document.getElementById('achievements-list').innerHTML = order.map(id => M.achievements.find(a => a.id === id)).map((a) => {
      const unlocked = s.unlocked.includes(a.id), value = Math.min(a.target, M.valueFor(a, s));
      const unit = ['spent', 'earned', 'member-earned'].includes(a.type) ? '円' : ['unique', 'regular'].includes(a.type) ? '種類' : '回';
      if (a.id === 'complete' && !M.specialUnlocked(s)) return '<article class="achievement-card achievement-secret"><div class="achievement-top"><div class="medallion" aria-hidden="true">?</div><span class="achievement-status">未解除</span></div><p class="eyebrow">AN UNDISCLOSED HONOR</p><h3>まだ見ぬ無駄。</h3><p>通常8実績と通常9品が揃うと、条件をご案内いたします。</p><div class="achievement-sealed">条件は、まだ非公開です。</div></article>';
      return `<article class="achievement-card ${a.id === 'complete' ? 'achievement-secret' : ''} ${unlocked ? 'unlocked' : ''}"><div class="achievement-top"><div class="medallion" aria-hidden="true">${a.symbol}</div><span class="achievement-status">${unlocked ? '✓ 解除済み' : '未解除'}</span></div><p class="eyebrow">HONOR N° 00${M.achievements.indexOf(a) + 1}</p><h3>${a.name}</h3><p>${a.description}</p><div class="achievement-progress"><label class="progress-label" for="progress-${a.id}"><span>達成状況</span><span>${value.toLocaleString('ja-JP')} / ${a.target.toLocaleString('ja-JP')}${unit}</span></label><progress id="progress-${a.id}" value="${value}" max="${a.target}">${value} / ${a.target}</progress></div></article>`;
    }).join('');
  }
  render(); window.addEventListener('muda:update', render);
})();
