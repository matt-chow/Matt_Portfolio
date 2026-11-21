/** Carousel motion: `p` is a continuous slot position, `target` the slot it springs to. Pure, so it is unit-tested. */
export interface Ring {
  p: number;
  v: number; // slots per second
  target: number;
  dragging: boolean;
}

export const ring = (p = 0): Ring => ({ p, v: 0, target: p, dragging: false });

// Slightly underdamped: a fast flick overshoots a hair and settles, which reads as weight.
const K = 110;
const C = 2 * Math.sqrt(K) * 0.78;

export function ringStep(r: Ring, dt: number): Ring {
  if (r.dragging) return r;
  const h = Math.min(dt, 1 / 30);
  const v = r.v + (K * (r.target - r.p) - C * r.v) * h;
  const p = r.p + v * h;
  return Math.abs(r.target - p) < 1e-4 && Math.abs(v) < 1e-3 ? { ...r, p: r.target, v: 0 } : { ...r, p, v };
}

export const settled = (r: Ring) => !r.dragging && r.p === r.target && r.v === 0;

/** Release a drag: project the flick forward and snap to a whole slot, at most three slots away. */
export function release(r: Ring, velocity: number): Ring {
  const jump = Math.max(-3, Math.min(3, Math.round(r.p + velocity * 0.22) - Math.round(r.p)));
  return { ...r, dragging: false, v: velocity, target: Math.round(r.p) + jump };
}

/** Step `by` slots from wherever the ring is heading, so rapid presses queue up instead of being lost. */
export const nudge = (r: Ring, by: number): Ring => ({ ...r, target: r.target + by });

/** Go to slot `i` of `n` the short way round. */
export function goTo(r: Ring, i: number, n: number): Ring {
  const d = (((i - r.target) % n) + n + n / 2) % n - n / 2;
  return { ...r, target: r.target + Math.round(d) };
}

export const slotOf = (p: number, n: number) => ((Math.round(p) % n) + n) % n;

/** Signed distance from slot i to position p, wrapped into [-n/2, n/2). */
export const offset = (i: number, p: number, n: number) => ((((i - p) % n) + n + n / 2) % n) - n / 2;
