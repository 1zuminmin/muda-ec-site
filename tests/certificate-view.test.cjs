const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
async function boot({ complete = false, missing = false, supported = true, cancelled = false } = {}) {
  const nodes = new Map([...read('certificate.html').matchAll(/id="([^"]+)"/g)].map(m => [m[1], { addEventListener(t, fn) { this[t] = fn; } }]));
  const artifact = { blob: new Blob(['png'], { type: 'image/png' }), filename: '認定証.png', title: '認定証', shareURL: 'https://twitter.com/intent/tweet?text=%40izuko_1231&url=https%3A%2F%2F1zuminmin.github.io%2Fmuda-ec-site%2F' };
  const calls = [], revoked = [], window = new EventTarget();
  class URLs extends URL { static createObjectURL() { return 'blob:certificate'; } static revokeObjectURL(url) { revoked.push(url); } }
  const M = { state: () => ({ history: missing ? [] : [{ id: 'TEST-1' }] }), createCertificate: async () => artifact, createCompletion: async () => artifact, completionShareNotice: '掲載不要と記載できます。' };
  window.Muda = M;
  vm.runInNewContext(read('js/certificate-view.js'), { window, URL: URLs, File, URLSearchParams,
    location: { search: complete ? '?complete=1' : '?purchase=TEST-1' },
    navigator: supported ? { canShare: () => true, share: async data => { if (cancelled) throw Object.assign(new Error(), { name: 'AbortError' }); calls.push(data); } } : {},
    document: { getElementById(id) { assert.ok(nodes.has(id), id); return nodes.get(id); } }
  });
  await new Promise(resolve => setImmediate(resolve));
  return { get: id => nodes.get(id), calls, artifact, window, revoked };
}
test('certificate viewer exposes the PNG, direct image and explicit save links without automatically downloading', async () => {
  const b = await boot({ supported: false });
  assert.equal(b.get('certificate-image').src, 'blob:certificate');
  assert.equal(b.get('certificate-save').href, 'blob:certificate');
  assert.equal(b.get('certificate-raw').href, 'blob:certificate');
  assert.equal(b.get('certificate-save').download, '認定証.png');
  assert.equal(b.get('certificate-content').hidden, false);
  assert.equal(b.calls.length, 0);
  const missing = await boot({ missing: true });
  assert.match(missing.get('certificate-status').textContent, /購入記録/);
});
test('image sharing happens only on a click, includes the public URL and mention, and cancellation stays on the viewer', async () => {
  const b = await boot({ complete: true });
  assert.equal(b.calls.length, 0); assert.equal(b.get('certificate-share').hidden, false);
  assert.match(b.get('certificate-share-note').textContent, /掲載不要/);
  await b.get('certificate-share').click();
  assert.equal(b.calls.length, 1); assert.equal(b.calls[0].files[0].type, 'image/png');
  assert.match(b.calls[0].text, /@izuko_1231/); assert.match(b.calls[0].text, /https:\/\/1zuminmin.github.io\/muda-ec-site\//);
  const cancelled = await boot({ cancelled: true }); await cancelled.get('certificate-share').click();
  assert.match(cancelled.get('certificate-status').textContent, /キャンセル/);
  assert.equal(cancelled.get('certificate-share').disabled, false);
});
