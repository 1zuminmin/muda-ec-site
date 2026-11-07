/* Two distinct, explicitly confirmed ways to start again. */
(() => {
  'use strict';
  const M = window.Muda, get = id => document.getElementById(id);
  const dialog = get('record-dialog'), acknowledge = get('record-acknowledge');
  let mode = null;
  function render() {
    const s = M.state();
    get('start-second-lap').disabled = s.lap !== 1 || !s.completion;
    get('lap-status').textContent = s.lap === 2 ? '現在2周目 ／ 周回紋章を継承しています。' : s.completion ? '1周目を完全クリアしました。2周目へお進みいただけます。' : '1周目を完全クリアすると、2周目をご案内します。';
  }
  function open(nextMode) {
    const s = M.state();
    if (nextMode === 'lap' && (s.lap !== 1 || !s.completion)) return;
    mode = nextMode; acknowledge.checked = false; get('record-confirm').disabled = true;
    get('record-error').textContent = '';
    get('record-dialog-title').textContent = mode === 'lap' ? '2周目へ、徒労を継承しますか。' : 'すべての記録をリセットしますか。';
    get('record-dialog-description').textContent = '所持金・購入履歴・累計額・内職の進捗と報酬・全実績・会員状態・支払済み会費・登録名・感謝状を削除します。元に戻せません。';
    get('record-dialog-retained').textContent = mode === 'lap' ? '引き継ぐのは「2周目の記録と紋章」だけです。通常報酬1.5倍、所持金0円で始まります。' : '周回記録と紋章も削除します。引き継ぐゲーム記録はありません。1周目・所持金0円に戻ります。';
    get('record-certificate').hidden = !s.completion;
    get('record-confirm').textContent = mode === 'lap' ? '清算して2周目を始める' : 'すべて削除して最初から';
    dialog.showModal();
  }
  get('start-second-lap').addEventListener('click', () => open('lap'));
  get('reset-all-records').addEventListener('click', () => open('all'));
  acknowledge.addEventListener('change', () => { get('record-confirm').disabled = !acknowledge.checked; });
  get('record-cancel').addEventListener('click', () => dialog.close());
  get('record-confirm').addEventListener('click', () => {
    if (!dialog.open || !acknowledge.checked || !mode) return;
    try {
      if (mode === 'lap') M.startSecondLap(); else M.clear();
      dialog.close(); location.reload();
    } catch (error) { get('record-error').textContent = error.message; }
  });
  dialog.addEventListener('close', () => { mode = null; acknowledge.checked = false; });
  render(); window.addEventListener('muda:update', render);
})();
