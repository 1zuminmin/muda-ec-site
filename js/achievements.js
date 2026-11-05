(() => {
  const M = window.Muda;
  function render() {
    const s = M.state();
    document.getElementById('unlocked-count').textContent = s.unlocked.length;
    document.getElementById('overall-progress').value = s.unlocked.length;
    document.getElementById('overall-percent').textContent = Math.round(s.unlocked.length / M.achievements.length * 100) + '%';
    document.getElementById('achievements-list').innerHTML = M.achievements.map((a, i) => {
      const unlocked = s.unlocked.includes(a.id), value = Math.min(a.target, M.valueFor(a, s));
      const unit = a.type === 'spent' ? '円' : a.type === 'unique' ? '種類' : '回';
      return `<article class="achievement-card ${unlocked ? 'unlocked' : ''}"><div class="achievement-top"><div class="medallion" aria-hidden="true">${a.symbol}</div><span class="achievement-status">${unlocked ? '✓ 解除済み' : '未解除'}</span></div><p class="eyebrow">HONOR N° 00${i + 1}</p><h3>${a.name}</h3><p>${a.description}</p><label class="progress-label" for="progress-${a.id}"><span>達成状況</span><span>${value.toLocaleString('ja-JP')} / ${a.target.toLocaleString('ja-JP')}${unit}</span></label><progress id="progress-${a.id}" value="${value}" max="${a.target}">${value} / ${a.target}</progress></article>`;
    }).join('');
  }
  render(); window.addEventListener('muda:update', render);
})();
