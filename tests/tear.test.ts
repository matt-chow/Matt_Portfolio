import { describe, expect, it } from 'vitest';
import { COMPLETE, drag, inZone, intent, nudgeTear, release, seam, SEAM_V, separation, tear0, tearStep, type Tear } from '../src/ui/tear';

const run = (t: Tear, seconds: number, fps = 60) => {
  for (let s = 0; s < seconds; s += 1 / fps) t = tearStep(t, 1 / fps);
  return t;
};

describe('drag to tear', () => {
  it('tracks the pointer continuously and only completes past the threshold', () => {
    let t = tear0();
    for (let px = 10; px <= 150; px += 10) t = drag(t, 0, px, 300);
    expect(t.p).toBeCloseTo(0.5);
    expect(t.torn).toBe(false);
    t = drag(t, 0, COMPLETE * 300 - 1, 300);
    expect(t.torn).toBe(false);
    t = drag(t, 0, COMPLETE * 300, 300);
    expect(t.torn).toBe(true);
    expect(run(t, 0.5).p).toBe(1); // the rest rips on its own
  });

  it('tears from either side, and the first pull fixes the direction', () => {
    const left = drag(tear0(), 0, -120, 300);
    expect(left.dir).toBe(-1);
    expect(left.p).toBeCloseTo(0.4);
    // Dragging the other way afterwards slackens instead of tearing further or mending.
    expect(drag(left, left.p, 60, 300).p).toBeCloseTo(0.4);
    expect(drag(tear0(), 0, 90, 300).dir).toBe(1);
  });

  it('an interrupted tear keeps its progress and the flap relaxes without snapping shut', () => {
    let t = drag(tear0(), 0, 150, 300);
    t = run(t, 0.4);
    expect(t.lift).toBeGreaterThan(0.9);
    const settled = run(release(t), 0.22); // a short damped settle
    expect(Math.abs(settled.lift - 0.6)).toBeLessThan(0.05);
    t = run(release(t), 1);
    expect(t.p).toBeCloseTo(0.5);
    expect(t.lift).toBeCloseTo(0.6, 2); // rests visibly open
    // Resuming carries on from where it stopped, and only the far edge frees the strip.
    expect(drag(t, t.p, 1, 300).p).toBeCloseTo(0.5 + 1 / 300);
    expect(drag(t, t.p, 120, 300).torn).toBe(false);
    expect(drag(t, t.p, 150, 300).torn).toBe(true);
  });

  it('a fast partial swipe leaves a partial tear', () => {
    const t = run(release(drag(drag(tear0(), 0, 60, 300, 0.008), 0, 270, 300, 0.008)), 1);
    expect(t.p).toBeCloseTo(0.9);
    expect(t.torn).toBe(false);
  });

  it('dragging back flexes the flap without mending, and a re-grab mid-settle does not jump', () => {
    let t = run(drag(tear0(), 0, 150, 300), 0.3);
    t = drag(t, 0, 90, 300); // pointer back to 30%
    expect(t.p).toBeCloseTo(0.5);
    expect(t.aim).toBeCloseTo(-0.2);
    t = run(t, 0.3);
    expect(t.slack).toBeLessThan(-0.15);
    // Let go, then grab again 60ms into the settle: the pose carries on from where it was.
    t = run(release(t), 0.06);
    const before = { lift: t.lift, slack: t.slack };
    t = run(drag(t, t.p, 0.5, 300), 1 / 60);
    expect(Math.abs(t.lift - before.lift)).toBeLessThan(0.08);
    expect(Math.abs(t.slack - before.slack)).toBeLessThan(0.06);
    expect(t.p).toBeCloseTo(0.5, 2);
  });

  it('ignores taps and vertical scrolls, and only starts in the tear strip', () => {
    expect(intent(4, 3)).toBe(null);
    expect(intent(3, 40)).toBe('scroll');
    expect(intent(30, 10)).toBe('tear');
    expect(inZone(0.5, 0.05)).toBe(true);
    expect(inZone(-0.1, 0.1)).toBe(true); // starting just off the edge is natural
    expect(inZone(0.5, 0.6)).toBe(false);
    const t = tear0();
    expect(drag(t, 0, 0, 300)).toBe(t);
  });

  it('keyboard steps tear in one direction and complete', () => {
    let t = tear0();
    for (let i = 0; i < 4; i++) t = nudgeTear(t, -1);
    expect(t.dir).toBe(-1);
    expect(t.pulling).toBe(false);
    expect(t.p).toBeCloseTo(0.8);
    expect(t.torn).toBe(false);
    expect(nudgeTear(t, 1).torn).toBe(true);
  });

  it('gives the same motion at 30, 60 and 144 fps', () => {
    const t = drag(tear0(), 0, 120, 300);
    const a = run(t, 0.3, 30);
    const b = run(t, 0.3, 144);
    expect(a.lift).toBeCloseTo(b.lift, 1);
    expect(Number.isFinite(tearStep(t, 5).lift)).toBe(true); // a backgrounded tab
  });
});

describe('wrapper separation', () => {
  it('strip flies the way it was torn, curls, fades, and the body settles before handover', () => {
    const start = separation(0, 1);
    expect(start.x).toBe(0);
    expect(start.fade).toBe(1);
    const mid = separation(0.5, 1);
    expect(mid.x).toBeGreaterThan(0.3);
    expect(separation(0.5, -1).x).toBeLessThan(-0.3);
    expect(mid.curl).toBeGreaterThan(1);
    const end = separation(1.55, 1);
    expect(end.fade).toBe(0);
    expect(end.drop).toBe(1);
    expect(Math.abs(end.flex)).toBeLessThan(0.002);
    expect(end.open).toBeGreaterThan(0.95);
    expect(end.open).toBeLessThan(1.1); // settles with little overshoot
  });

  it('builds an irregular seam that stays near the tear line', () => {
    const s = seam(42, 48);
    expect(s).toHaveLength(49);
    expect(s.every((v) => Math.abs(v - SEAM_V) < 0.03)).toBe(true);
    expect(new Set(s.map((v) => v.toFixed(4))).size).toBeGreaterThan(40);
    expect(seam(42, 48)).toEqual(s);
    // A shallow bow with small nicks, not a sawtooth.
    expect(s[24] - (s[0] + s[48]) / 2).toBeGreaterThan(0.006);
    const steps = s.slice(1).map((v, i) => Math.abs(v - s[i]));
    expect(Math.max(...steps)).toBeLessThan(0.013);
    expect(steps.filter((d) => d > 0.003).length).toBeGreaterThan(2);
    expect(steps.filter((d) => d > 0.003).length).toBeLessThan(24);
  });
});
