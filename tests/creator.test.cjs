const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

function render(override, complete = false, nativeShare) {
  const window = new EventTarget(), map = new Map(), nodes = new Map();
  const element = () => ({ innerHTML: '', textContent: '', hidden: false, insertAdjacentHTML() {} });
  const node = id => { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); };
  const policy = element(), pending = element(), creator = element(), unset = element();
  const events = {};
  const document = {
    body: { dataset: { page: 'author' } }, getElementById: node, addEventListener: (type, fn) => { events[type] = fn; }, querySelector: () => null,
    querySelectorAll: selector => ({ '[data-streaming-policy]': [policy], '[data-streaming-pending]': [pending], '[data-creator-x]': [creator], '[data-creator-unset]': [unset] })[selector] || []
  };
  const context = vm.createContext({ window, document, Date, CustomEvent, structuredClone, URLSearchParams, URL, setTimeout, navigator: nativeShare,
    localStorage: { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
  });
  vm.runInContext(read('js/storage.js'), context);
  vm.runInContext(read('js/config.js'), context);
  if (override) window.IminaiConfig = override;
  const M = window.Muda;
  if (complete) {
    const s = M.state();
    s.history = M.products.map((p, i) => ({ id: `TEST-${i}`, productId: p.id, price: p.price, date: s.lastUsed }));
    s.totalSpent = 171000; s.completion = { date: s.lastUsed, totalSpent: 171000, count: 10 };
    map.set('muda-shokai:v1', JSON.stringify(s));
  }
  vm.runInContext(read('js/main.js'), context);
  vm.runInContext(read('js/certificate.js'), context);
  return { M, node, creator, unset, policy, pending, events };
}

test('author X and approved streaming policy appear in author page, footer and completed collection', () => {
  const r = render(null, true);
  assert.equal(r.M.creatorURL, 'https://x.com/izuko_1231');
  assert.equal(r.creator.href, r.M.creatorURL); assert.equal(r.creator.hidden, false); assert.equal(r.unset.hidden, true);
  assert.match(r.node('site-footer').innerHTML, /href="https:\/\/x.com\/izuko_1231"/);
  assert.match(r.node('site-footer').innerHTML, /href="terms.html"/);
  assert.match(r.node('site-footer').innerHTML, /href="privacy.html"/);
  assert.match(r.node('collection-status').innerHTML, /この無意味を作った作者のX/);
  assert.match(r.policy.textContent, /収益化を含めて/); assert.match(r.policy.textContent, /紹介は許可の条件ではありません/);
  assert.equal(r.pending.hidden, true);
});

test('unset or invalid author names create no external link; policy alternatives remain consistent', () => {
  for (const creatorX of ['', 'https://evil.example/', '<script>alert(1)</script>', 'abcdefghijklmnop', null]) {
    const r = render({ creatorX, streamingPolicy: 'pending' }, true);
    assert.equal(r.M.creatorURL, ''); assert.equal(r.creator.hidden, true); assert.equal(r.unset.hidden, false);
    assert.doesNotMatch(r.node('site-footer').innerHTML, /https:\/\/x.com/);
    assert.match(r.node('collection-status').innerHTML, /author.html#creator/);
    assert.equal(r.pending.hidden, false);
  }
  const r = render({ creatorX: '@izuko_1231', streamingPolicy: 'noncommercial' });
  assert.equal(r.M.creatorURL, 'https://x.com/izuko_1231');
  assert.match(r.policy.textContent, /収益を得ない利用に限り/);
});

test('only completion shares mention the configured author and disclose the opt-out before sharing', () => {
  const text = link => new URL(link).searchParams.get('text');
  const playing = render();
  assert.doesNotMatch(text(playing.M.summaryShareURL()), /@izuko_1231/);
  const completed = render(null, true);
  const share = new URL(completed.M.summaryShareURL());
  assert.match(share.searchParams.get('text'), /@izuko_1231/);
  assert.equal(share.searchParams.get('url'), 'https://iminai-shokai.pages.dev/');
  assert.match(completed.node('collection-status').innerHTML, /掲載不要/);
  assert.match(completed.node('collection-status').innerHTML, /原則として/);
  assert.match(text(completed.M.shareURL({ productId: 'final-envelope', price: 100000 })), /@izuko_1231/);
  assert.doesNotMatch(text(completed.M.shareURL({ productId: 'stone', price: 500 })), /@izuko_1231/);
  completed.M.setName('公開しないニックネーム');
  assert.doesNotMatch(text(completed.M.summaryShareURL()), /公開しないニックネーム/);
  const changed = render({ creatorX: 'another_author', streamingPolicy: 'monetized' }, true);
  assert.match(text(changed.M.summaryShareURL()), /@another_author/);
  const unset = render({ creatorX: '', streamingPolicy: 'monetized' }, true);
  assert.doesNotMatch(text(unset.M.summaryShareURL()), /@izuko_1231|@undefined/);
});

test('app sharing is opt-in, uses the OS chooser and leaves the X web link as a fallback', async () => {
  const calls = [], r = render(null, true, { share: async data => { calls.push(data); } });
  assert.match(r.M.appShareButton(r.M.summaryShareURL()), /アプリで共有/);
  assert.equal(calls.length, 0);
  const button = { dataset: { shareApp: encodeURIComponent(r.M.summaryShareURL()) } };
  await r.events.click({ target: { closest: selector => selector === '[data-share-app]' ? button : null } });
  assert.equal(calls.length, 1); assert.match(calls[0].text, /@izuko_1231/);
  assert.match(calls[0].text, /https:\/\/iminai-shokai\.pages\.dev\//);
  assert.equal(button.disabled, false);
  assert.match(r.node('collection-status').innerHTML, /twitter.com\/intent\/tweet/);
  assert.equal(render().M.appShareButton('https://example.com'), '');
});
