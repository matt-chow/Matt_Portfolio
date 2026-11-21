import { getState } from './store';

// Synthesized effects: no audio files to load. The context is created lazily,
// so nothing plays until a user gesture has triggered a sound call.
let ctx: AudioContext | undefined;

function audio() {
  if (getState().settings.muted || typeof AudioContext === 'undefined') return;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', gain = 0.08) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, a.currentTime + at);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + at + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + at);
  o.stop(a.currentTime + at + dur);
}

function noise(dur: number, from: number, to: number, gain = 0.12) {
  const a = audio();
  if (!a) return;
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  src.buffer = buf;
  f.type = 'bandpass';
  f.frequency.setValueAtTime(from, a.currentTime);
  f.frequency.exponentialRampToValueAtTime(to, a.currentTime + dur);
  g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

export const sfx = {
  tear: () => noise(0.45, 900, 4000, 0.2),
  flip: () => noise(0.08, 2400, 1200, 0.1),
  tick: () => tone(1400, 0, 0.04, 'square', 0.02),
  reveal: (rank: number) => [523, 659, 784, 1047, 1319].slice(0, 2 + rank).forEach((f, i) => tone(f, i * 0.07, 0.35, 'triangle', 0.05)),
  slab: () => (tone(110, 0, 0.25, 'sine', 0.2), noise(0.12, 600, 300, 0.1)),
  medal: () => [784, 988, 1175].forEach((f, i) => tone(f, i * 0.09, 0.5, 'sine', 0.05)),
};
