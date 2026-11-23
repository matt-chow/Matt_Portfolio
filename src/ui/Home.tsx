import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { profile } from '../content/manifest';
import { cardsInPack, packs, type PackDef } from '../engine/packs';
import { openAndGo } from './Opening';
import type { State } from '../engine/state';
import { useStore } from '../store';
import { Icon } from './Icons';
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
function PackRing({ handle, onFail, focus, setFocus }: { handle: React.MutableRefObject<RingHandle | null>; onFail(): void; focus: number; setFocus(i: number): void }) {
  const s = useStore();
  const canvas = useRef<HTMLCanvasElement>(null);
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
  }, [handle, onFail, setFocus]);
  const pack = packs[focus];
  return (
    <div className={`ring3d ${ready ? 'is-ready' : ''}`} role="region" aria-roledescription="carousel" aria-label="Packs">
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
    </div>
  );
}

export function Home() {
  const list = useRef<HTMLUListElement>(null);
  const ring = useRef<RingHandle | null>(null);
  const reduce = useReducedMotion();
  const [use3d, setUse3d] = useState(canRing);
  const [focus, setFocus] = useState(0);
  const fail = useRef(() => setUse3d(false)).current;
  const picker = useRef<HTMLDivElement>(null);
  // Keep the chosen chip in view when the picker is a one-line strip. Scrolls only the strip, never the page.
  useEffect(() => {
    const p = picker.current, c = p?.children[focus] as HTMLElement | undefined;
    if (p && c && p.scrollWidth > p.clientWidth) p.scrollTo({ left: c.offsetLeft - (p.clientWidth - c.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }, [focus, reduce]);
  const slots = () => [...(list.current?.querySelectorAll<HTMLElement>('.slot-link') ?? [])];
  /** One entry point for the picker, arrows and keys, so the ring (or flat shelf) and the chips never disagree. */
  const select = (i: number) => {
    i = (i + packs.length) % packs.length;
    if (ring.current) return ring.current.goTo(i); // the ring reports back through onFocus as it turns
    setFocus(i);
    slots()[i]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  };
  const scrollBy = (dir: number) => (ring.current ? ring.current.step(dir) : select(focus + dir));
  // Flat shelf: whichever pack sits nearest the middle is the selected one, however it got there.
  const onShelfScroll = () => {
    const l = list.current!;
    const mid = l.getBoundingClientRect().left + l.clientWidth / 2;
    const d = slots().map((el) => Math.abs(el.getBoundingClientRect().left + el.offsetWidth / 2 - mid));
    setFocus(d.indexOf(Math.min(...d)));
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
  // Arrow keys move along the picker from the focused chip (not the ring's current slot), so quick presses queue up.
  const onPickKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const by = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const chips = [...e.currentTarget.querySelectorAll<HTMLElement>('.chip')];
    const at = chips.indexOf(document.activeElement as HTMLElement);
    if (!by || at < 0) return;
    e.preventDefault();
    const i = (at + by + packs.length) % packs.length;
    chips[i].focus();
    select(i);
  };
  return (
    <div className="home">
      <div className="home-side">
        <section className="intro">
          <h1>{profile.name}</h1>
          <p className="lede">{profile.tagline}</p>
          <p className="muted sub">{profile.sub}</p>
          <nav className="shortcuts" aria-label="Links">
            <a className="icon-btn primary" href={profile.resume} target="_blank" rel="noreferrer" aria-label="Résumé (PDF), opens in a new tab" data-tip="Résumé"><Icon name="resume" /></a>
            <a className="icon-btn" href={`mailto:${profile.email}`} aria-label="Email" data-tip="Email"><Icon name="email" /></a>
            <a className="icon-btn" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub, opens in a new tab" data-tip="GitHub"><Icon name="github" /></a>
            <a className="icon-btn" href="#/index" aria-label="Index: profile and experience" data-tip="Index"><Icon name="index" /></a>
          </nav>
        </section>
      </div>

      <div className="shelf">
        <div className="pack-bar">
          <button className="icon-btn" onClick={() => scrollBy(-1)} aria-label="Previous pack"><Icon name="prev" /></button>
          <div className="pack-picker" ref={picker} role="group" aria-label="Choose a pack" onKeyDown={onPickKey}>
            {packs.map((p, i) => (
              <button key={p.id} className="chip" aria-pressed={i === focus} onClick={() => select(i)}>
                {p.name}
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={() => scrollBy(1)} aria-label="Next pack"><Icon name="next" /></button>
        </div>
        {use3d ? (
          <PackRing handle={ring} onFail={fail} focus={focus} setFocus={setFocus} />
        ) : (
          <ul className="carousel" ref={list} onKeyDown={onKey} onScroll={onShelfScroll} aria-label="Packs">
            {packs.map((p, i) => <PackSlot key={p.id} pack={p} i={i} />)}
            <li className="slot">
              <a className="medal-tile" href="#/medals">
                <span className="medal medal-gold big" aria-hidden="true"><span>★</span></span>
                <strong>Medals</strong>
                <span className="small muted">Earned by collecting and grading.</span>
              </a>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
