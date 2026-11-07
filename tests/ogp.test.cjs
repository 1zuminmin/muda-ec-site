const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('home share card has static public metadata and a matching readable PNG asset', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const tags = new Map();
  for (const tag of html.matchAll(/<meta\s+(?:property|name)="([^"]+)"\s+content="([^"]*)"\s*\/?>/g)) {
    assert.ok(!tags.has(tag[1]), `duplicate metadata: ${tag[1]}`);
    tags.set(tag[1], tag[2]);
  }
  assert.equal(tags.get('og:url'), 'https://iminai-shokai.pages.dev/');
  assert.equal(tags.get('og:type'), 'website');
  assert.equal(tags.get('twitter:card'), 'summary_large_image');
  const imageURL = new URL(tags.get('og:image'));
  assert.equal(imageURL.origin, 'https://iminai-shokai.pages.dev');
  assert.equal(tags.get('twitter:image'), imageURL.href);
  for (const key of ['og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description', 'twitter:image:alt']) assert.ok(tags.get(key)?.length, key);
  const png = fs.readFileSync(path.join(root, imageURL.pathname.slice(1)));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert.equal(Number(tags.get('og:image:width')), width);
  assert.equal(Number(tags.get('og:image:height')), height);
  assert.equal(tags.get('og:image:type'), 'image/png');
  assert.ok(width >= 1200 && height >= 600 && width / height > 1.8 && width / height < 2.1);
  assert.ok(png.length < 5 * 1024 * 1024);
});
