(() => {
  const M = window.Muda;
  const date = value => new Date(value).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  M.purchaseDate = date;
  M.shareURL = purchase => {
    const p = M.products.find(p => p.id === purchase.productId);
    const text = `無駄遣い商会で「${p.name}」に${M.money(purchase.price)}を無駄遣いしました。\n${p.message}\n認定番号：${purchase.id}\n架空の購入・実際の支払いなし\n#無駄遣い商会`;
    const params = new URLSearchParams({ text });
    if (['http:', 'https:'].includes(location.protocol) && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) params.set('url', new URL('index.html', location.href).href);
    return 'https://twitter.com/intent/tweet?' + params;
  };
  M.downloadCertificate = async purchase => {
    await document.fonts.ready;
    const p = M.products.find(p => p.id === purchase.productId);
    const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 1100;
    const c = canvas.getContext('2d'); if (!c) throw new Error('このブラウザでは認定証を生成できません。');
    c.fillStyle = '#111d29'; c.fillRect(0, 0, 1600, 1100);
    c.strokeStyle = '#b8a276'; c.lineWidth = 2; c.strokeRect(42, 42, 1516, 1016); c.lineWidth = 1; c.strokeRect(57, 57, 1486, 986);
    const serif = '"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif CJK JP", serif';
    const sans = '"Yu Gothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif';
    function line(text, y, size, color = '#eee9df', font = serif) { c.fillStyle = color; c.font = `${size}px ${font}`; c.textAlign = 'center'; c.fillText(text, 800, y, 1400); }
    line('無駄遣い商会', 149, 34, '#b8a276'); line('CERTIFICATE OF GLORIOUS WASTE', 212, 21, '#b8a276', sans);
    line('無駄遣い認定証', 345, 76); line('ここに、あなたの見事な無駄遣いを認定いたします。', 429, 27);
    c.strokeStyle = '#5b5547'; c.beginPath(); c.moveTo(300, 480); c.lineTo(1300, 480); c.stroke();
    line(p.name, 571, 48); line(`架空購入金額  ${M.money(purchase.price)}`, 640, 35, '#b8a276');
    line('お客様の架空の資産は、何の役にも立たないものへと変換されました。', 726, 25, '#d0ccc3');
    line('その勇気あるご決断に、心より敬意を表します。', 773, 25, '#d0ccc3');
    line(`認定日  ${date(purchase.date)}`, 863, 24, '#b8a276', sans); line(`認定番号  ${purchase.id}`, 908, 22, '#b8a276', sans);
    line('架空の購入・実際の支払いなし', 994, 25, '#eee9df', sans);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('画像の保存に失敗しました。');
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `無駄遣い認定証-${purchase.id}.png`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  };
})();
