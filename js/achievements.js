(() => {
  const M = window.Muda;
  function render() {
    const s = M.state(), progress = M.honorProgress(s);
    document.getElementById('unlocked-count').textContent = progress.count;
    document.getElementById('overall-progress').max = progress.total;
    document.getElementById('overall-progress').value = progress.count;
    document.getElementById('overall-percent').textContent = Math.round(progress.count / progress.total * 100) + '%';
    document.getElementById('achievements-list').innerHTML = [...M.regularAchievements.slice(0, 4), M.achievements.find(a => a.id === 'complete'), ...M.regularAchievements.slice(4)].map((a) => {
      const unlocked = s.unlocked.includes(a.id), value = Math.min(a.target, M.valueFor(a, s));
      const unit = ['spent', 'earned', 'member-earned'].includes(a.type) ? '円' : ['unique', 'regular'].includes(a.type) ? '種類' : '回';
      if (a.id === 'complete' && !M.specialUnlocked(s)) return '<article class="achievement-card"><div class="achievement-top"><div class="medallion" aria-hidden="true">?</div><span class="achievement-status">未解除</span></div><p class="eyebrow">AN UNDISCLOSED HONOR</p><h3>まだ見ぬ無駄。</h3><p>お得意様になった方だけに、条件をご案内いたします。</p></article>';
      return `<article class="achievement-card ${unlocked ? 'unlocked' : ''}"><div class="achievement-top"><div class="medallion" aria-hidden="true">${a.symbol}</div><span class="achievement-status">${unlocked ? '✓ 解除済み' : '未解除'}</span></div><p class="eyebrow">HONOR N° 00${M.achievements.indexOf(a) + 1}</p><h3>${a.name}</h3><p>${a.description}</p><label class="progress-label" for="progress-${a.id}"><span>達成状況</span><span>${value.toLocaleString('ja-JP')} / ${a.target.toLocaleString('ja-JP')}${unit}</span></label><progress id="progress-${a.id}" value="${value}" max="${a.target}">${value} / ${a.target}</progress></article>`;
    }).join('');
  }
  render(); window.addEventListener('muda:update', render);
})();
