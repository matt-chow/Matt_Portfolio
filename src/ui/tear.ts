/** Drag-to-tear model for the pack wrapper. Pure and stepped by real time, so it is unit-tested and frame-rate independent. */

export const COMPLETE = 0.999; // the strip only comes free once the tear reaches the far edge
export const SEAM_V = 0.86; // seam height as a fraction of the pack, measured from the bottom
export const SEP_END = 1.55; // seconds from separation to handing over to the card reveal

export interface Tear {
  p: number; // how far along the seam it is torn, 0..1; torn foil never mends
  dir: -1 | 0 | 1; // 1 = left to right; fixed by the first pull
  lift: number; // how far the torn flap is pulled away from the body
  liftV: number;
  tension: number; // recent pull strength: wrinkles at the tear front and the rip sound
  aim: number; // how far the pointer is behind the committed tear (<= 0): flexes the flap without mending the seam
  slack: number; // aim, sprung, so a release or re-grab never jumps
  slackV: number;
  speed: number; // smoothed tear speed in seams per second, handed to the flying strip
  pulling: boolean;
  torn: boolean;
}

export const tear0 = (): Tear => ({ p: 0, dir: 0, lift: 0, liftV: 0, tension: 0, aim: 0, slack: 0, slackV: 0, speed: 0, pulling: false, torn: false });

/** Where a press may start a tear, in pack-relative coordinates (0..1, y down): the strip above the seam plus some slop. */
export const inZone = (nx: number, ny: number) => nx >= -0.2 && nx <= 1.2 && ny >= -0.14 && ny <= 1 - SEAM_V + 0.16;

/** A press becomes a tear only once it moves 10px mostly sideways; mostly vertical means the user is scrolling. */
export function intent(dx: number, dy: number): 'tear' | 'scroll' | null {
  if (Math.hypot(dx, dy) < 10) return null;
  return Math.abs(dx) > Math.abs(dy) * 1.2 ? 'tear' : 'scroll';
}

/** The pointer has moved `dx` px since a drag began at progress `p0`; `span` px tears the whole seam. Either direction works. */
export function drag(t: Tear, p0: number, dx: number, span: number, dt = 1 / 60): Tear {
  if (t.torn || !dx) return t;
  const dir = t.dir || (dx > 0 ? 1 : -1);
  const raw = p0 + (dir * dx) / span;
  const p = Math.min(1, Math.max(t.p, raw)); // pulling back only slackens the flap
  const dp = p - t.p;
  return {
    ...t,
    dir,
    p,
    pulling: true,
    aim: Math.max(-0.25, Math.min(0, raw - p)),
    tension: Math.min(1, t.tension + dp * 5),
    speed: t.speed * 0.7 + (dp / Math.max(dt, 1 / 240)) * 0.3,
    torn: p >= COMPLETE,
  };
}

export const release = (t: Tear): Tear => ({ ...t, pulling: false, aim: 0 });

/** Keyboard: rip another `by` of the seam in direction `dir`. */
export const nudgeTear = (t: Tear, dir: 1 | -1, by = 0.2): Tear => release(drag(t, t.p, (t.dir || dir) * by, 1, 0.12));

export function tearStep(t: Tear, dt: number): Tear {
  let { p, lift, liftV, slack, slackV, tension, speed } = t;
  // Pulled flaps stand up; released ones settle (~180ms, slight overshoot) into a visibly open rest and keep their tear.
  const target = t.torn || t.pulling ? 1 : p > 0 ? 0.6 : 0;
  const k = 780;
  const c = 2 * Math.sqrt(k) * 0.65;
  for (let left = Math.min(dt, 0.1); left > 1e-6; left -= 1 / 120) {
    const h = Math.min(left, 1 / 120);
    liftV += (k * (target - lift) - c * liftV) * h;
    lift += liftV * h;
    slackV += (k * (t.aim - slack) - c * slackV) * h;
    slack += slackV * h;
    tension *= Math.exp(-h * 4);
    speed *= Math.exp(-h * (t.pulling ? 3 : 8));
    if (t.torn) p = 1 - (1 - p) * Math.exp(-h * 16);
  }
  if (t.torn && p > 0.999) p = 1;
  return { ...t, p, lift, liftV, slack, slackV, tension, speed };
}

/** Seam heights (pack fractions from the bottom) for `n + 1` columns: a shallow bow, a little wander and a few small nicks, stable per seed. */
export function seam(seed: number, n: number) {
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const v = Array.from({ length: n + 1 }, (_, i) => SEAM_V + 0.014 * Math.sin((Math.PI * i) / n) + 0.0025 * Math.sin(i * 0.43 + seed) + (rnd() - 0.5) * 0.002);
  for (let i = 2; i < n - 1; i++)
    if (rnd() < 0.18) {
      const depth = 0.004 + rnd() * 0.007;
      v[i] -= depth;
      v[i + (rnd() < 0.5 ? -1 : 1)] -= depth * 0.4; // lopsided, so the nicks are not all the same V
    }
  return v;
}

export const hash = (str: string) => [...str].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

// Closed-form springs: same value at any frame rate. `rise` goes 0 → 1, `bump` is an impulse that rings back to 0.
const omega = (f: number) => 2 * Math.PI * f;
export function rise(t: number, f: number, z: number) {
  if (t <= 0) return 0;
  const w = omega(f);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
}
export const bump = (t: number, f: number, z: number) => (t <= 0 ? 0 : Math.exp(-z * omega(f) * t) * Math.sin(omega(f) * Math.sqrt(1 - z * z) * t));
const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Everything after the tear completes, `t` seconds in, in pack units (pack width 1, y up). `speed` is the tear speed at release. */
export function separation(t: number, dir: 1 | -1, speed = 1) {
  const fling = 0.8 + Math.min(1.5, Math.max(0, speed)) * 0.35; // a fast swipe throws the strip harder
  const drift = 1 - Math.exp(-t * 5); // quick, so the strip clears the opening by ~0.3s, before the cards rise
  return {
    x: dir * fling * drift * 0.95,
    y: 0.9 * t - 1.6 * t * t, // tossed up, then falls away
    z: 0.25 * drift,
    rz: -dir * (0.5 * drift + 0.3 * bump(t, 2.2, 0.45)), // twists in the direction it was thrown
    rx: 1.1 * drift,
    recoil: bump(t, 3, 0.4), // the freed flap snaps back past its peel, then follows the throw
    curl: 3.2 * rise(t, 1.1, 0.7), // radians across the strip as it springs into a curl
    fade: 1 - smooth(0.55, 0.9, t),
    flex: 0.035 * bump(t, 3, 0.35), // the body squashes once and rings out
    open: rise(t - 0.1, 1.6, 0.8), // lips peel apart
    drop: smooth(1.0, 1.5, t), // body falls away to hand over to the cards
  };
}
