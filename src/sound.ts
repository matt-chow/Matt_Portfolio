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

/**
 * One shaped puff of fresh noise. The highpass strips the body (thin laminated film has none), the bandpass sets its sheen,
 * and the envelope rises from and decays to silence so nothing clicks.
 */
function puff(dur: number, freq: number, q: number, gain: number, { at = 0, attack = 0.002, hp = 1800 } = {}) {
  const a = audio();
  if (!a) return;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  buf.getChannelData(0).forEach((_, i, d) => (d[i] = Math.random() * 2 - 1));
  const src = a.createBufferSource();
  const hi = a.createBiquadFilter();
  const band = a.createBiquadFilter();
  const g = a.createGain();
  const t = a.currentTime + at;
  src.buffer = buf;
  src.playbackRate.value = 0.94 + Math.random() * 0.12; // no two identical
  hi.type = 'highpass';
  hi.frequency.value = hp;
  band.type = 'bandpass';
  band.frequency.value = freq;
  band.Q.value = q;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(hi).connect(band).connect(g).connect(a.destination);
  src.start(t);
  src.stop(t + dur + 0.02);
}

/** Sparse random ticks: the fine crackle of a laminate seam letting go, about `rate` per second at normal speed. */
function crackleBuffer(a: AudioContext, dur: number, rate: number, len = 0.0005) {
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  const tick = Math.ceil(a.sampleRate * len);
  for (let n = 0; n < dur * rate; n++) {
    const at = Math.floor(Math.random() * (d.length - tick));
    const amp = (0.25 + Math.random() * 0.75) * (Math.random() < 0.5 ? -1 : 1);
    for (let i = 0; i < tick; i++) d[at + i] += amp * (Math.random() * 2 - 1) * (1 - i / tick);
  }
  return buf;
}

/**
 * Tear tuning. `volume`: overall level. `body`: the mid-range crinkle under the crisp zip (0 = thinnest film, 1 = medium
 * laminate; nothing goes below 900 Hz either way). `brightness`: scales the zip's pitch (1 = as tuned).
 */
export const TEAR = { volume: 0.12, body: 0.7, brightness: 1 };

type Voice = { a: AudioContext; out: GainNode; band: BiquadFilterNode; crackle: AudioBufferSourceNode; hiss: AudioBufferSourceNode; grit: AudioBufferSourceNode; body: GainNode; idle?: number };
let voice: Voice | undefined;

function startVoice(a: AudioContext): Voice {
  const hiss = a.createBufferSource();
  hiss.buffer = a.createBuffer(1, a.sampleRate * 3, a.sampleRate);
  hiss.buffer.getChannelData(0).forEach((_, i, d) => (d[i] = Math.random() * 2 - 1));
  const crackle = a.createBufferSource();
  crackle.buffer = crackleBuffer(a, 2.3, 420); // loop lengths differ, so the mix never repeats on a short cycle
  hiss.loop = crackle.loop = true;
  const hissGain = a.createGain();
  hissGain.gain.value = 0.22;
  const hi = a.createBiquadFilter();
  hi.type = 'highpass';
  hi.frequency.value = 2500;
  const band = a.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 0.6;
  band.frequency.value = 5000;
  const out = a.createGain();
  out.gain.value = 0;
  hiss.connect(hissGain).connect(hi);
  crackle.connect(hi);
  hi.connect(band).connect(out).connect(a.destination);
  // Body: coarser, sparser creases of the film itself, kept in the mids (highpass 900) so it adds substance but no bass.
  const grit = a.createBufferSource();
  grit.buffer = crackleBuffer(a, 1.7, 320, 0.0012);
  grit.loop = true;
  const cut = a.createBiquadFilter();
  cut.type = 'highpass';
  cut.frequency.value = 900;
  const mid = a.createBiquadFilter();
  mid.type = 'bandpass';
  mid.Q.value = 0.8;
  mid.frequency.value = 1900;
  const body = a.createGain();
  body.gain.value = 0;
  grit.connect(cut).connect(mid).connect(body).connect(out);
  hiss.start(0, Math.random() * 3);
  crackle.start(0, Math.random() * 2.3);
  grit.start(0, Math.random() * 1.7);
  return { a, out, band, crackle, hiss, grit, body };
}

/**
 * The tear itself, one continuous voice: `force` (0..1, from tear speed) sets its loudness, brightness and how fast the
 * crackle runs, so a slow pull ticks and a fast one zips. Call every frame; 0 glides it out and frees it shortly after.
 */
function tearing(force: number) {
  if (getState().settings.muted || force < 0.02) force = 0;
  if (!voice) {
    const a = force ? audio() : undefined;
    if (!a) return;
    voice = startVoice(a);
  }
  const v = voice;
  const t = v.a.currentTime;
  v.out.gain.setTargetAtTime(TEAR.volume * force ** 0.5, t, force ? 0.025 : 0.06); // sqrt keeps a slow pull audible
  v.crackle.playbackRate.setTargetAtTime(0.45 + force * 1.6, t, 0.04);
  v.grit.playbackRate.setTargetAtTime(0.6 + force * 1.1, t, 0.04);
  v.body.gain.setTargetAtTime(TEAR.body * 2.4 * (0.7 + 0.3 * force), t, 0.05);
  v.band.frequency.setTargetAtTime((4200 + force * 3800) * TEAR.brightness, t, 0.05);
  if (force) {
    clearTimeout(v.idle);
    v.idle = undefined;
  } else
    v.idle ??= window.setTimeout(() => {
      v.hiss.stop();
      v.crackle.stop();
      v.grit.stop();
      v.out.disconnect();
      if (voice === v) voice = undefined;
    }, 500);
}

/** Shimmer: a soft, airy swell of high noise, the sound of the foil catching light. */
const shimmer = (at: number, dur: number, gain: number) => puff(dur, 8200, 0.5, gain, { at, attack: dur * 0.3, hp: 5000 });

export const sfx = {
  // Fingertip on the wrapper: two or three barely-there ticks of film.
  crinkle: () =>
    [0, 1, 2].forEach((k) => Math.random() < 0.8 && puff(0.012 + Math.random() * 0.012, 6500 + Math.random() * 3000, 1.2, 0.012 + Math.random() * 0.01, { at: k * (0.012 + Math.random() * 0.03), attack: 0.001 })),
  tearing,
  // The last of the seam lets go: a short plastic snap, a touch of mid body (scaled by TEAR.body) and no thump under it.
  snap: () => (
    puff(0.05, 4200, 0.8, 0.08, { attack: 0.0015 }),
    puff(0.018, 9500, 1, 0.045, { attack: 0.0005 }),
    puff(0.035, 2000, 1, 0.07 * TEAR.body, { attack: 0.001, hp: 900 })
  ),
  // The loose strip and wrapper flutter: an airy swell, high and quiet.
  rustle: () => (puff(0.42, 7000, 0.6, 0.022, { attack: 0.12 }), puff(0.3, 5200, 0.7, 0.014, { at: 0.14, attack: 0.07 })),
  // The card stack sliding out: soft, dry card stock, lower and smoother than the film.
  slide: () => puff(0.3, 1700, 0.7, 0.035, { attack: 0.09, hp: 500 }),
  flip: () => noise(0.08, 2400, 1200, 0.075),
  tick: () => tone(1400, 0, 0.04, 'square', 0.02),
  reveal: (rank: number) => [523, 659, 784, 1047, 1319].slice(0, 2 + rank).forEach((f, i) => tone(f, i * 0.07, 0.35, 'triangle', 0.05)),
  /**
   * Card reveal by level (see revealLevel): 0 keeps the plain two-note chime, 1 a short glint, 2 a rising arpeggio with a
   * shimmer, 3 a fuller arpeggio over a soft pad, 4 that plus a falling sparkle flourish. Offset 80 ms so the first
   * note lands as the card turns edge-on and its face appears. Every level stays below the tear and snap.
   */
  unveil: (level: number) => {
    const at = 0.08;
    if (level === 0) return sfx.reveal(0);
    if (level === 1) return [1568, 2093].forEach((f, i) => tone(f, at + i * 0.06, 0.22, 'sine', 0.03));
    const notes = level === 2 ? [784, 988, 1175, 1568] : [659, 784, 988, 1319, 1568, 1976];
    notes.forEach((f, i) => tone(f, at + i * 0.055, 0.4, 'triangle', 0.04));
    shimmer(at, 0.5 + level * 0.1, 0.012 + level * 0.003);
    if (level >= 3) [392, 587].forEach((f) => tone(f, at, 0.8, 'sine', 0.025));
    if (level === 4) [2637, 2349, 1976, 2637].forEach((f, i) => tone(f, at + 0.42 + i * 0.07, 0.3, 'sine', 0.022));
  },
  slab: () => (tone(110, 0, 0.25, 'sine', 0.2), noise(0.12, 600, 300, 0.1)),
  medal: () => [784, 988, 1175].forEach((f, i) => tone(f, i * 0.09, 0.5, 'sine', 0.05)),
};
