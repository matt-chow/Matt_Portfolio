import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { profile } from '../content/manifest';
import { cardsInPack, PACK_SIZES, packs, type PackDef } from '../engine/packs';
import { openAndGo } from './Opening';
import { updateSettings, type State } from '../engine/state';
import { act, useStore } from '../store';
import { useTilt } from './Card';
import { canGL, PackArt } from './Pack';
import type { RingHandle } from './ring3d';

function packStatus(s: State, pack: PackDef) {
  const total = cardsInPack(pack.id).length;
  const found = Object.keys(s.discovered).filter((k) => cardsInPack(pack.id).some((c) => k.startsWith(`${c.id}|`))).length;
  const opened = s.opened[pack.id] ?? 0;
  return opened ? `Opened ${opened}× · ${found} of ${total * pack.tiers.length} finishes found` : `First opening reveals all ${total} cards`;
}

/** The 3D ring needs WebGL2 and motion; everything else gets the flat scroller. */
const canRing = () => typeof matchMedia !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches && canGL();

function PackSlot({ pack, i }: { pack: PackDef; i: number }) {
  const s = useStore();
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref);
  const reduce = useReducedMotion();
  const opened = s.opened[pack.id] ?? 0;
  const status = packStatus(s, pack);
  return (
    <motion.li
      className={`slot ${pack.id === 'starter' ? 'slot-hero' : ''}`}
      initial={reduce ? false : { opacity: 0, y: 40, rotate: i % 2 ? 2 : -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.08 * i }}
    >
      {pack.id === 'starter' && !opened && <span className="ribbon">Start here</span>}
      <a href={`#/open/${pack.id}`} className="slot-link" aria-label={`${pack.name} pack. ${pack.tagline} ${status}`}>
        <div ref={ref} className="pack-tilt">
          <PackArt pack={pack} />
        </div>
      </a>
      <div className="slot-meta">
        <h2>{pack.name}</h2>
        <p>{pack.tagline}</p>
        <p className="muted small">{status}</p>
        <button className="btn btn-quiet" onClick={() => openAndGo(pack.id, true)}>
          Quick open
        </button>
      </div>
    </motion.li>
  );
}

/** WebGL ring with a DOM twin: the canvas is decorative, every action lives in real buttons and links. */
function PackRing({ handle, onFail }: { handle: React.MutableRefObject<RingHandle | null>; onFail(): void }) {
  const s = useStore();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [focus, setFocus] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    let h: RingHandle | null = null;
    import('./ring3d')
      .then((m) => m.mountRing(canvas.current!, packs, { start: 0, onFocus: setFocus, onOpen: (i) => (location.hash = `#/open/${packs[i].id}`) }))
      .then((x) => {
        h = x;
        if (!live) return x.dispose();
        handle.current = x;
        setReady(true);
      })
      .catch(onFail);
    return () => {
      live = false;
      handle.current = null;
      h?.dispose();
    };
  }, [handle, onFail]);
  const pack = packs[focus];
  const onKey = (e: KeyboardEvent) => {
    const by = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!by || (e.target as HTMLElement).closest('.ring-tabs') === null) return;
    e.preventDefault();
    handle.current?.step(by);
  };
  return (
    <div className={`ring3d ${ready ? 'is-ready' : ''}`} role="region" aria-roledescription="carousel" aria-label="Packs" onKeyDown={onKey}>
      <canvas ref={canvas} className="ring-canvas" aria-hidden="true" />
      <div className="ring-meta" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pack.id}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <p className="ring-count small muted">{focus + 1} of {packs.length}{pack.id === 'starter' && !s.opened.starter ? ' · start here' : ''}</p>
            <h3>{pack.name}</h3>
            <p>{pack.tagline}</p>
            <p className="muted small">{packStatus(s, pack)}</p>
          </motion.div>
        </AnimatePresence>
        <p className="ring-actions">
          <a className="btn" href={`#/open/${pack.id}`}>Open {pack.name}</a>
          <button className="btn btn-quiet" onClick={() => openAndGo(pack.id, true)}>Quick open</button>
        </p>
      </div>
      <div className="ring-tabs" role="group" aria-label="Choose a pack">
        {packs.map((p, i) => (
          <button key={p.id} className="chip" aria-pressed={i === focus} onClick={() => handle.current?.goTo(i)}>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Home() {
  const s = useStore();
  const list = useRef<HTMLUListElement>(null);
  const ring = useRef<RingHandle | null>(null);
  const [use3d, setUse3d] = useState(canRing);
  const fail = useRef(() => setUse3d(false)).current;
  const scrollBy = (dir: number) => {
    if (ring.current) return ring.current.step(dir);
    list.current?.scrollBy({ left: dir * list.current.clientWidth * 0.6, behavior: 'smooth' });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const links = [...(list.current?.querySelectorAll<HTMLElement>('.slot-link, .medal-tile') ?? [])];
    const i = links.indexOf(document.activeElement as HTMLElement);
    const next = links[Math.max(0, Math.min(links.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)))];
    next?.focus();
    next?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    e.preventDefault();
  };
  return (
    <div className="home">
      <section className="intro">
        <h1>{profile.name}</h1>
        <p className="lede">{profile.tagline}</p>
        <p className="muted">{profile.sub}</p>
        <p className="shortcuts">
          <a className="btn" href={profile.resume}>Résumé (PDF)</a>
          <a className="btn btn-quiet" href={`mailto:${profile.email}`}>Email</a>
          <a className="btn btn-quiet" href={profile.github}>GitHub</a>
          <a className="btn btn-quiet" href="#/index">Read it all on one page</a>
        </p>
      </section>

      <section className="shelf" aria-labelledby="shelf-h">
        <div className="shelf-head">
          <h2 id="shelf-h">Pick a pack</h2>
          <div className="shelf-ctrl">
            <fieldset className="seg" aria-label="Cards per repeat pack">
              <legend className="small muted">Cards per pack</legend>
              {PACK_SIZES.map((n) => (
                <label key={n}>
                  <input type="radio" name="size" checked={s.settings.packSize === n} onChange={() => act((x) => updateSettings(x, { packSize: n }))} />
                  <span>{n}</span>
                </label>
              ))}
            </fieldset>
            <button className="icon-btn" onClick={() => scrollBy(-1)} aria-label="Previous pack">‹</button>
            <button className="icon-btn" onClick={() => scrollBy(1)} aria-label="Next pack">›</button>
          </div>
        </div>
        {use3d ? (
          <PackRing handle={ring} onFail={fail} />
        ) : (
          <ul className="carousel" ref={list} onKeyDown={onKey}>
            {packs.map((p, i) => <PackSlot key={p.id} pack={p} i={i} />)}
            <li className="slot">
              <a className="medal-tile" href="#/medals">
                <span className="medal medal-gold big" aria-hidden="true"><span>★</span></span>
                <strong>Medals</strong>
                <span className="small muted">Earned by collecting, exploring and grading. Never from packs.</span>
              </a>
            </li>
          </ul>
        )}
        <p className="small muted hint">Unlimited free packs. Repeat packs always include at least one mid-rarity card or better. Drag, swipe or use the arrows to browse.</p>
      </section>
    </div>
  );
}
