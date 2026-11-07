const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function harness(state) {
  const nodes = new Map([...fs.readFileSync(path.join(__dirname, '../mypage.html'), 'utf8').matchAll(/id="([^"]+)"/g)].map(m => [m[1], {
    events: {}, addEventListener(t, fn) { this.events[t] = fn; }, fire(t) { this.events[t]?.(); },
    showModal() { this.open = true; }, close() { this.open = false; this.fire('close'); }
  }]));
  const calls = { lap: 0, clear: 0, reload: 0 };
  const window = new EventTarget();
  window.Muda = { state: () => state, startSecondLap() { calls.lap++; }, clear() { calls.clear++; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/records.js'), 'utf8'), { window, document: { getElementById: id => nodes.get(id) }, location: { reload() { calls.reload++; } } });
  return { get: id => nodes.get(id), calls };
}
test('full reset is available before completion, requires acknowledgment, and can be canceled', () => {
  const h = harness({ lap: 1, completion: null });
  assert.equal(h.get('start-second-lap').disabled, true);
  h.get('reset-all-records').fire('click'); assert.equal(h.get('record-dialog').open, true);
  assert.match(h.get('record-dialog-retained').textContent, /周回記録と紋章も削除/);
  h.get('record-confirm').fire('click'); assert.equal(h.calls.clear, 0);
  h.get('record-acknowledge').checked = true; h.get('record-acknowledge').fire('change');
  h.get('record-cancel').fire('click'); h.get('record-confirm').fire('click'); assert.equal(h.calls.clear, 0);
  h.get('reset-all-records').fire('click'); assert.equal(h.get('record-confirm').disabled, true);
  h.get('record-acknowledge').checked = true; h.get('record-acknowledge').fire('change');
  h.get('record-confirm').fire('click'); assert.equal(h.calls.clear, 1); assert.equal(h.calls.lap, 0); assert.equal(h.calls.reload, 1);
});
test('lap transition has its own explanation, certificate link and action; second lap cannot advance again', () => {
  const h = harness({ lap: 1, completion: { date: '2026-11-07' } });
  assert.equal(h.get('start-second-lap').disabled, false); h.get('start-second-lap').fire('click');
  assert.match(h.get('record-dialog-retained').textContent, /引き継ぐのは/); assert.equal(h.get('record-certificate').hidden, false);
  h.get('record-acknowledge').checked = true; h.get('record-confirm').fire('click');
  assert.equal(h.calls.lap, 1); assert.equal(h.calls.clear, 0);
  const second = harness({ lap: 2, completion: {} });
  assert.equal(second.get('start-second-lap').disabled, true); second.get('start-second-lap').fire('click'); assert.ok(!second.get('record-dialog').open);
  second.get('reset-all-records').fire('click'); assert.equal(second.get('record-dialog').open, true);
});
