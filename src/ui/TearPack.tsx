import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { motion } from 'motion/react';
import type { PackDef } from '../engine/packs';
import { sfx } from '../sound';
import { canGL, PackArt, seamClips } from './Pack';
import type { PackHandle, PackView } from './pack3d';
import { drag, hash, inZone, intent, nudgeTear, release, seam, SEAM_V, SEP_END, separation, tear0, tearStep, type Tear } from './tear';

type Gesture = { id: number; x: number; y: number; p0: number; t: number; mode: 'pending' | 'tear' | 'press' };

/**
 * A sealed pack you open by dragging across its top strip. The tear follows the pointer, keeps partial progress when let go,
 * and rips the rest once past the threshold. Foil is WebGL when available, clipped CSS packs otherwise.
 */
export function TearPack({ pack, auto, reduce, rich, onTorn, onDone }: { pack: PackDef; auto: boolean; reduce: boolean; rich: boolean; onTorn(): void; onDone(): void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const three = useRef<PackHandle | null>(null);
  const [gl, setGl] = useState<'loading' | 'on' | 'off'>(() => (!reduce && canGL() ? 'loading' : 'off'));
  const [torn, setTorn] = useState(false);
  const [pct, setPct] = useState(0); // in tens, for the slider value and the guide
  const [pulling, setPulling] = useState(false);
  const st = useRef<Tear>(tear0());
  const gesture = useRef<Gesture | null>(null);
  const dragged = useRef(false);
  const aim = useRef({ x: 0, y: 0, press: 0, u: 0.5, v: 0.5 });
  const light = useRef<HTMLDivElement>(null);
  const cb = useRef({ auto, rich, onTorn, onDone });
  cb.current = { auto, rich, onTorn, onDone };
  const seamPts = useMemo(() => seam(hash(pack.id), 48), [pack.id]);
  const clips = useMemo(() => seamClips(seamPts), [seamPts]);
  const want3d = gl !== 'off';

  useEffect(() => {
    if (!want3d) return;
    let live = true;
    import('./pack3d')
      .then((m) => m.mountPack(canvas.current!, pack))
      .then((h) => {
        if (!live) return h.dispose();
        three.current = h;
        setGl('on');
      })
      .catch(() => live && setGl('off'));
    return () => {
      live = false;
      three.current?.dispose();
      three.current = null;
    };
  }, [want3d, pack]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const start = last;
    let sep = -1;
    let fired = false;
    let done = false;
    let tenth = 0;
    let lit = '';
    const view: PackView = { tear: st.current, sep, tiltX: 0, tiltY: 0, press: { u: 0.5, v: 0.5, amt: 0 }, time: 0 };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      let t = st.current;
      if (cb.current.auto && !t.torn) t = drag(t, t.p, (t.dir || 1) * (dt / 0.6), 1, dt); // the button tears it for you in 0.6s
      t = tearStep(t, dt);
      st.current = t;
      sfx.tearing(t.torn ? 0 : Math.min(1, t.speed / 2));
      if (t.torn && !fired) {
        fired = true;
        sfx.snap();
        navigator.vibrate?.(12);
        setTorn(true);
        cb.current.onTorn();
        if (reduce) {
          done = true;
          return cb.current.onDone();
        }
      }
      if (sep >= 0) {
        if (sep < 0.25 && sep + dt >= 0.25) sfx.slide(); // as the card stack starts to rise
        if (sep < 0.06 && sep + dt >= 0.06) sfx.leak(cb.current.rich); // a few frames in, once the roll has reached `rich`
        sep += dt;
      } else if (t.torn && t.p > 0.97) {
        sep = 0;
        sfx.rustle();
      }
      const ease = 1 - Math.exp(-dt * 8);
      view.tiltX += (aim.current.x - view.tiltX) * ease;
      view.tiltY += (aim.current.y - view.tiltY) * ease;
      view.press = { u: aim.current.u, v: aim.current.v, amt: view.press.amt + (aim.current.press - view.press.amt) * ease * 1.5 };
      view.tear = t;
      view.sep = sep;
      view.time = (now - start) / 1000;
      if (three.current) three.current.draw(view);
      else drawFlat(view);
      // Light through the gap: centred on the torn span while partial, then a release envelope as the strip flies off.
      const open = t.torn ? 1 : t.p;
      const burst = sep < 0 ? 0 : Math.min(1, sep / 0.25) * Math.max(0, 1 - Math.max(0, sep - 0.4) / 1.05);
      const lx = (0.4 + (t.dir < 0 ? 1 - open / 2 : open / 2)) / 1.8; // the light plane overhangs the pack by 40% each side
      const next = `--open:${open.toFixed(3)};--burst:${burst.toFixed(3)};--lx:${(lx * 100).toFixed(1)}%`;
      if (next !== lit && light.current) light.current.style.cssText = lit = next;
      if (Math.round(t.p * 10) !== tenth) setPct((tenth = Math.round(t.p * 10)));
      if (sep >= SEP_END && !done) {
        done = true;
        cb.current.onDone();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      sfx.tearing(0);
    };
  }, [reduce]);

  /** Flat fallback: the strip hinges at the untorn end, then flies off the same way as the 3D one. */
  function drawFlat(v: PackView) {
    if (!top.current || !body.current) return;
    const t = v.tear;
    const dir = t.dir || 1;
    const sp = v.sep >= 0 ? separation(v.sep, dir, t.speed) : null;
    top.current.style.transformOrigin = `${dir > 0 ? 100 : 0}% ${(1 - SEAM_V) * 100}%`;
    top.current.style.transform = sp
      ? `translate(${sp.x * 100}%, ${(-sp.y / 1.64) * 100}%) rotate(${-sp.rz}rad)` // 1.64 = pack height / width
      : `translateY(${-t.lift * t.p * 4}%) rotate(${-dir * t.lift * t.p * 7}deg)`;
    top.current.style.opacity = String(sp ? sp.fade : 1);
    body.current.style.transform = sp ? `translateY(${sp.drop * 25}%) scale(${1 + sp.flex * 0.6}, ${1 - sp.flex})` : '';
    body.current.style.opacity = String(1 - (sp?.drop ?? 0));
    wrap.current?.style.setProperty('--px', `${(v.tiltX + 1) * 50}%`);
  }

  const local = (e: PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    return { nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height, w: r.width };
  };
  const onDown = (e: PointerEvent) => {
    if (st.current.torn || e.button > 0) return;
    const { nx, ny } = local(e);
    dragged.current = false;
    const g = { id: e.pointerId, x: e.clientX, y: e.clientY, p0: st.current.p, t: e.timeStamp };
    if (inZone(nx, ny)) {
      gesture.current = { ...g, mode: 'pending' };
      sfx.crinkle();
    } else if (nx >= 0 && nx <= 1 && ny <= 1) {
      gesture.current = { ...g, mode: 'press' };
      aim.current = { ...aim.current, press: 1, u: nx, v: 1 - ny };
    }
  };
  const onMove = (e: PointerEvent) => {
    const { nx, ny, w } = local(e);
    const g = gesture.current;
    if (!g || g.mode === 'press') aim.current = { ...aim.current, x: Math.max(-1, Math.min(1, nx * 2 - 1)), y: Math.max(-1, Math.min(1, ny * 2 - 1)) };
    if (!g || g.id !== e.pointerId || g.mode === 'press') return;
    const dx = e.clientX - g.x;
    if (g.mode === 'pending') {
      const i = intent(dx, e.clientY - g.y);
      if (i === 'scroll') gesture.current = null;
      if (i !== 'tear') return;
      g.mode = 'tear';
      dragged.current = true;
      wrap.current!.setPointerCapture(e.pointerId);
      setPulling(true);
    }
    st.current = drag(st.current, g.p0, dx, w * 0.9, (e.timeStamp - g.t) / 1000);
    g.t = e.timeStamp;
  };
  const onUp = () => {
    if (gesture.current?.mode === 'tear') st.current = release(st.current);
    gesture.current = null;
    aim.current = { ...aim.current, press: 0 };
    setPulling(false);
  };
  const onKey = (e: KeyboardEvent) => {
    const dir = ({ ArrowRight: 1, ArrowLeft: -1 } as const)[e.key as 'ArrowRight'];
    if (!dir || st.current.torn) return;
    e.preventDefault();
    st.current = nudgeTear(st.current, dir);
  };

  const guide = !torn && !pulling && pct === 0;
  return (
    <div
      ref={wrap}
      className={`tear-wrap ${gl === 'on' ? 'is-3d' : ''} ${pulling ? 'is-pulling' : ''}`}
      tabIndex={torn ? -1 : 0}
      role="slider"
      aria-label={`Tear the top off the ${pack.name} pack: drag across the top strip, or use the arrow keys`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct * 10}
      aria-valuetext={torn ? 'Torn open' : pct ? `${pct * 10}% torn` : 'Sealed'}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      onPointerLeave={() => !gesture.current && (aim.current = { ...aim.current, x: 0, y: 0 })}
      onKeyDown={onKey}
      // A drag that finishes the tear must not also count as the tap that skips the animation.
      onClickCapture={(e) => dragged.current && (e.stopPropagation(), (dragged.current = false))}
    >
      <div className="tear-shadow" aria-hidden="true" />
      {torn && !reduce && (
        <motion.div className="stack-rise" aria-hidden="true" initial={{ y: '6%' }} animate={{ y: ['6%', '6%', '-34%', '-20%'] }} transition={{ duration: 1.4, times: [0, 0.25, 0.62, 1], ease: 'easeOut' }}>
          {[-1, 0, 1].map((k) => (
            <motion.div key={k} className="mini-back" animate={{ rotate: [0, 0, k * 9], x: [0, 0, k * 28] }} transition={{ duration: 1.5, times: [0, 0.7, 1], ease: [0.2, 0.8, 0.2, 1] }} />
          ))}
        </motion.div>
      )}
      {gl !== 'off' && <canvas ref={canvas} className="tear-canvas" aria-hidden="true" />}
      {gl !== 'on' && (
        <>
          <div ref={body} className="tear-layer">
            <PackArt pack={pack} clip={clips.body} />
          </div>
          <div ref={top} className="tear-layer top">
            <PackArt pack={pack} clip={clips.top} />
          </div>
        </>
      )}
      <div ref={light} className={`pack-light ${rich ? 'is-rich' : ''}`} aria-hidden="true" />
      <svg className={`tear-guide ${guide ? '' : 'is-hidden'}`} viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" style={{ top: `${(1 - SEAM_V) * 100 - 3}%` }}>
        <polyline points={seamPts.map((v, i) => `${(i / 48) * 100},${5 + (SEAM_V - v) * 167}`).join(' ')} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
