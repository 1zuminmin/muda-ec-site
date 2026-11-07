(() => {
  'use strict';
  const M = window.Muda, get = id => document.getElementById(id), params = new URLSearchParams(location.search);
  let artifact, objectURL, file;
  const isCompletion = params.get('complete') === '1';
  async function prepare() {
    try {
      if (isCompletion) artifact = await M.createCompletion();
      else {
        const purchase = M.state().history.find(p => p.id === params.get('purchase'));
        if (!purchase) throw new Error('このブラウザに該当する購入記録がありません。購入履歴から開き直してください。');
        artifact = await M.createCertificate(purchase);
      }
      objectURL = URL.createObjectURL(artifact.blob);
      get('certificate-title').textContent = artifact.title;
      get('certificate-image').src = objectURL;
      get('certificate-save').href = objectURL; get('certificate-save').download = artifact.filename;
      get('certificate-raw').href = objectURL;
      get('certificate-x').href = artifact.shareURL; get('certificate-x').hidden = !artifact.shareURL;
      get('certificate-share-note').hidden = !isCompletion;
      if (isCompletion) get('certificate-share-note').textContent = M.completionShareNotice;
      get('certificate-content').hidden = false;
      get('certificate-status').textContent = '画像を用意しました。保存・共有方法をお選びください。';
      if (typeof File === 'function' && navigator.share && navigator.canShare) {
        file = new File([artifact.blob], artifact.filename, { type: 'image/png' });
        try { get('certificate-share').hidden = !navigator.canShare({ files: [file] }); } catch { file = null; }
      }
    } catch (error) { get('certificate-title').textContent = '認定証を開けませんでした。'; get('certificate-status').textContent = error.message; }
  }
  get('certificate-share').addEventListener('click', async () => {
    if (!file) return;
    const button = get('certificate-share'); button.disabled = true;
    try {
      const params = new URL(artifact.shareURL).searchParams;
      const text = [params.get('text'), params.get('url')].filter(Boolean).join('\n');
      await navigator.share({ files: [file], title: artifact.title, text });
      get('certificate-status').textContent = '画像を共有先へ渡しました。投稿・送信の確定は選んだアプリで行ってください。';
    } catch (error) {
      get('certificate-status').textContent = error.name === 'AbortError' ? '共有をキャンセルしました。' : 'この環境では画像共有を開けませんでした。画像を保存してからアプリに添付してください。';
    } finally { button.disabled = false; }
  });
  window.addEventListener('pagehide', event => { if (!event.persisted && objectURL) URL.revokeObjectURL(objectURL); });
  void prepare();
})();
