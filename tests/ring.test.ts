import { describe, expect, it } from 'vitest';
import { goTo, nudge, offset, release, ring, ringStep, settled, slotOf } from '../src/ui/ringPhysics';

const run = (r: ReturnType<typeof ring>, seconds: number) => {
  let peak = r.p;
  for (let t = 0; t < seconds; t += 1 / 60) {
    r = ringStep(r, 1 / 60);
    peak = Math.max(peak, r.p);
  }
  return { r, peak };
};

describe('pack carousel motion', () => {
  it('settles exactly on the target slot with a small overshoot, and stops', () => {
    const { r, peak } = run(nudge(ring(), 1), 1.5);
    expect(settled(r)).toBe(true);
    expect(r.p).toBe(1);
    expect(peak).toBeGreaterThan(1); // momentum carries past before the settle
    expect(peak).toBeLessThan(1.08);
  });

  it('a hard flick travels further than a gentle one, capped at three slots', () => {
    const drag = { ...ring(0.2), dragging: true };
    expect(release(drag, 1).target).toBe(0);
    expect(release(drag, 8).target).toBe(2);
    expect(release(drag, 80).target).toBe(3);
    expect(release(drag, -80).target).toBe(-3);
  });

  it('queues rapid key presses and takes the short way round', () => {
    expect(nudge(nudge(ring(), 1), 1).target).toBe(2);
    expect(goTo(ring(0), 5, 6).target).toBe(-1);
    expect(goTo(ring(0), 2, 6).target).toBe(2);
    expect(slotOf(-1, 6)).toBe(5);
    expect(offset(0, 5.5, 6)).toBeCloseTo(0.5);
    expect(offset(3, 0, 6)).toBe(-3);
  });

  it('holds still while dragging and survives a long frame', () => {
    const drag = { ...nudge(ring(), 1), dragging: true };
    expect(ringStep(drag, 1 / 60)).toBe(drag);
    const r = ringStep(nudge(ring(), 1), 2); // tab was backgrounded
    expect(Number.isFinite(r.p) && r.p < 1.5).toBe(true);
  });
});
