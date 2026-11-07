/* Original procedural paper foley. No audio downloads or external services. */
(() => {
  'use strict';
  const KEY = 'iminai:paper-sound';
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let enabled = true, context = null, master = null, lastRub = -Infinity;
  const buffers = new Map(), voices = new Set();
  try { enabled = localStorage.getItem(KEY) !== 'off'; } catch { /* Preferences are optional. */ }
  async function unlock() {
    if (!enabled || !AudioContextClass) return null;
    try {
      if (!context || context.state === 'closed') {
        context = new AudioContextClass(); master = context.createGain();
        master.gain.value = 0.045; master.connect(context.destination); buffers.clear();
      }
      if (context.state === 'suspended') await context.resume();
      return enabled && context.state === 'running' ? context : null;
    } catch { return null; }
  }
  function bufferFor(type) {
    if (buffers.has(type)) return buffers.get(type);
    const length = type === 'rare' ? 0.85 : type === 'peel' ? 0.32 : 0.14;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * length), context.sampleRate);
    const data = buffer.getChannelData(0);
    let smooth = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / context.sampleRate, position = i / data.length;
      if (type === 'rare') {
        // A subdued low bell, with a soft attack and slowly fading overtones.
        const attack = Math.min(1, t / .035), decay = Math.exp(-t * 5);
        data[i] = attack * decay * (Math.sin(t * Math.PI * 2 * 110) * .48 + Math.sin(t * Math.PI * 2 * 220.4) * .2 + Math.sin(t * Math.PI * 2 * 331) * .08);
        continue;
      }
      const noise = Math.random() * 2 - 1;
      smooth = smooth * 0.72 + noise * 0.28;
      // Rub: a soft, continuous grain. Peel: several brief irregular crackles.
      const grain = type === 'peel' ? Math.pow(Math.max(0, Math.sin(t * 195) * Math.sin(t * 71)), 2) : 0.65 + 0.35 * Math.sin(t * 83);
      const envelope = Math.min(1, position * 35) * Math.pow(1 - position, type === 'peel' ? 1.5 : 0.8);
      data[i] = (type === 'peel' ? noise * 0.65 + smooth * 0.35 : smooth) * grain * envelope;
    }
    buffers.set(type, buffer); return buffer;
  }
  async function play(type) {
    const audio = await unlock(); if (!audio || !enabled || document.hidden) return;
    try {
      const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
      source.buffer = bufferFor(type);
      filter.type = type === 'rare' ? 'lowpass' : 'bandpass'; filter.frequency.value = type === 'rare' ? 1200 : type === 'peel' ? 2400 : 1300; filter.Q.value = 0.55;
      const start = audio.currentTime, duration = source.buffer.duration;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.8, start + 0.008); gain.gain.linearRampToValueAtTime(0, start + duration);
      source.connect(filter); filter.connect(gain); gain.connect(master); voices.add(source);
      source.onended = () => { voices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(start); source.stop(start + duration);
    } catch { /* Sound never blocks work or payments. */ }
  }
  function stop() { voices.forEach(source => { try { source.stop(); } catch { /* Already stopped. */ } }); voices.clear(); }
  window.Muda.paperSound = {
    get enabled() { return enabled; },
    get supported() { return !!AudioContextClass; },
    unlock,
    rare() { void play('rare'); },
    rub() { if (!enabled || Date.now() - lastRub < 115) return; lastRub = Date.now(); void play('rub'); },
    finish(type) { void play(type === 'peel' ? 'peel' : 'rub'); },
    setEnabled(value) {
      enabled = !!value;
      if (master) master.gain.value = enabled ? 0.045 : 0;
      if (!enabled) stop();
      try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* Keep in memory. */ }
      if (enabled) void unlock();
    }
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
})();
