(() => {
  'use strict';
  const M = window.Muda, list = document.getElementById('honor-roll-list');
  const records = Array.isArray(window.IminaiHonorRoll) ? window.IminaiHonorRoll : [];
  const validDate = date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date + 'T00:00:00Z')) && new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) === date;
  const entries = records.filter(record => record && typeof record.name === 'string' && record.name.trim() && M.nameLength(record.name) <= 20 && !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(record.name) && validDate(record.completedOn));
  document.getElementById('honor-roll-count').textContent = entries.length;
  document.getElementById('honor-roll-empty').hidden = entries.length > 0;
  entries.forEach(record => {
    const item = document.createElement('li'); item.className = 'honor-roll-entry';
    const mark = document.createElement('span'); mark.className = 'honor-roll-mark'; mark.textContent = '◇'; mark.setAttribute('aria-hidden', 'true');
    const name = document.createElement('h3'); name.textContent = record.name + ' 様';
    const time = document.createElement('time'); time.dateTime = record.completedOn;
    time.textContent = '完全クリア ' + record.completedOn.replaceAll('-', '.');
    item.append(mark, name, time); list.append(item);
  });
  function render() {
    const s = M.state();
    document.getElementById('honor-roll-local').hidden = !s.completion;
    document.getElementById('honor-roll-local-name').textContent = M.recipientName(s) + ' 様';
    document.getElementById('honor-roll-local-date').textContent = s.completion ? new Date(s.completion.date).toLocaleDateString('ja-JP') : '';
  }
  render(); window.addEventListener('muda:update', render);
})();
