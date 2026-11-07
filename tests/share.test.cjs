const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('all share links include the public site URL even when played locally', () => {
  for (const href of ['http://localhost:8080/shop.html', 'file:///C:/shop.html', 'https://1zuminmin.github.io/muda-ec-site/achievements.html']) {
    const window = new EventTarget(), map = new Map();
    const context = vm.createContext({ window, Date, CustomEvent, structuredClone, URLSearchParams,
      location: new URL(href), crypto: require('./helpers/normal-crypto.cjs'),
      localStorage: { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
    });
    vm.runInContext(read('js/storage.js'), context);
    vm.runInContext(read('js/certificate.js'), context);
    const M = window.Muda, purchase = { productId: 'stone', price: 500 };
    for (const link of [M.xShareURL('収集状況の共有 #伊見内商会'), M.xShareURL('完全クリアしました。'), M.shareURL(purchase)]) {
      const url = new URL(link);
      assert.equal(url.searchParams.get('url'), 'https://1zuminmin.github.io/muda-ec-site/');
      assert.ok(url.searchParams.get('text').includes('伊見内商会') || url.searchParams.get('text').includes('完全クリア'));
      assert.equal(url.searchParams.getAll('url').length, 1);
      assert.ok(!link.includes('localhost'));
    }
    assert.match(new URL(M.shareURL(purchase)).searchParams.get('text'), /¥500/);
  }
});
