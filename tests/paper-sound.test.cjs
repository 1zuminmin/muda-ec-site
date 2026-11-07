const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/paper-sound.js'), 'utf8');
function harness({ initial = null, available = true, resumeFails = false } = {}) {
  const stats = { contexts: 0, starts: 0, buffers: [], gains: [], stops: [] }, events = {}, preferences = new Map();
  if (initial !== null) preferences.set('iminai:paper-sound', initial);
  const node = () => ({ connect() {}, disconnect() {} });
  class AudioContext {
    constructor() { stats.contexts++; this.state = 'suspended'; this.sampleRate = 8000; this.currentTime = 0; this.destination = {}; }
    resume() { if (resumeFails) return Promise.reject(Error('blocked')); this.state = 'running'; return Promise.resolve(); }
    createGain() { const gain = { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} }; stats.gains.push(gain); return { ...node(), gain }; }
    createBuffer(channels, length, rate) { const samples = new Float32Array(length); stats.buffers.push(samples); return { duration: length / rate, getChannelData: () => samples }; }
    createBiquadFilter() { return { ...node(), frequency: { value: 0 }, Q: { value: 0 } }; }
    createBufferSource() { return { ...node(), start() { stats.starts++; }, stop(time) { stats.stops.push(time); } }; }
  }
  const document = { hidden: false, addEventListener: (type, fn) => { events[type] = fn; } }, window = { Muda: {}, AudioContext: available ? AudioContext : undefined };
  vm.runInContext(source, vm.createContext({ window, document, Date, localStorage: { getItem: k => preferences.get(k) ?? null, setItem: (k, v) => preferences.set(k, v) } }));
  return { sound: window.Muda.paperSound, stats, document, events, preferences };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('paper sounds create no audio at page load and generate short low-gain effects after interaction', async () => {
  const { sound, stats } = harness(); assert.equal(stats.contexts, 0); await sound.unlock(); sound.rub(); await flush(); sound.finish('peel'); await flush();
  assert.equal(stats.contexts, 1); assert.equal(stats.starts, 2); assert.equal(stats.gains[0].value, 0.045);
  assert.equal(stats.buffers.length, 2); assert.ok(stats.buffers.every(samples => samples.some(v => v !== 0) && samples.every(v => Math.abs(v) <= 1))); assert.ok(stats.buffers[1].length > stats.buffers[0].length);
});
test('muting stops active effects, persists and prevents queued playback', async () => {
  const h = harness(); h.sound.finish('peel'); h.sound.setEnabled(false); await flush(); assert.equal(h.stats.starts, 0); assert.equal(h.preferences.get('iminai:paper-sound'), 'off');
  h.sound.setEnabled(true); h.sound.finish('peel'); await flush(); assert.equal(h.stats.starts, 1); h.sound.setEnabled(false); assert.equal(h.stats.gains[0].value, 0); assert.ok(h.stats.stops.includes(undefined));
  const off = harness({ initial: 'off' }); off.sound.finish('seal'); await flush(); assert.equal(off.stats.contexts, 0);
});
test('unsupported or blocked audio remains silent without throwing, and backgrounding stops sounds', async () => {
  const unsupported = harness({ available: false }); assert.equal(unsupported.sound.supported, false); assert.equal(await unsupported.sound.unlock(), null); unsupported.sound.finish('peel'); await flush(); assert.equal(unsupported.stats.starts, 0);
  const blocked = harness({ resumeFails: true }); blocked.sound.finish('peel'); await flush(); assert.equal(blocked.stats.starts, 0);
  const h = harness(); h.sound.finish('peel'); await flush(); h.document.hidden = true; h.events.visibilitychange(); assert.ok(h.stats.stops.includes(undefined));
});


test('black-envelope bell has a longer low-amplitude decay and obeys mute and page visibility',async()=>{
  const h=harness(); h.sound.rare(); await flush(); assert.equal(h.stats.starts,1);
  const data=h.stats.buffers[0]; assert.equal(data.length,6800); assert.ok(data.some(n=>n!==0)); assert.ok(data.every(n=>Math.abs(n)<.8));
  h.sound.setEnabled(false); h.sound.rare(); await flush(); assert.equal(h.stats.starts,1);
  h.sound.setEnabled(true); h.document.hidden=true; h.sound.rare(); await flush(); assert.equal(h.stats.starts,1);
});
