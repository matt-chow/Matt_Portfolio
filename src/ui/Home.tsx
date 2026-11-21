import { useRef, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { profile } from '../content/manifest';
import { cardsInPack, PACK_SIZES, packs, type PackDef } from '../engine/packs';
import { openAndGo } from './Opening';
import { updateSettings } from '../engine/state';
import { act, useStore } from '../store';
import { useTilt } from './Card';
import { PackArt } from './Pack';

function PackSlot({ pack, i }: { pack: PackDef; i: number }) {
  const s = useStore();
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref);
  const reduce = useReducedMotion();
  const total = cardsInPack(pack.id).length;
  const found = Object.keys(s.discovered).filter((k) => cardsInPack(pack.id).some((c) => k.startsWith(`${c.id}|`))).length;
  const opened = s.opened[pack.id] ?? 0;
  const status = opened ? `Opened ${opened}× · ${found} of ${total * pack.tiers.length} finishes found` : `First opening reveals all ${total} cards`;
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

export function Home() {
  const s = useStore();
  const list = useRef<HTMLUListElement>(null);
  const scrollBy = (dir: number) => list.current?.scrollBy({ left: dir * list.current.clientWidth * 0.6, behavior: 'smooth' });
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
            <button className="icon-btn" onClick={() => scrollBy(-1)} aria-label="Scroll packs left">‹</button>
            <button className="icon-btn" onClick={() => scrollBy(1)} aria-label="Scroll packs right">›</button>
          </div>
        </div>
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
        <p className="small muted hint">Unlimited free packs. Repeat packs always include at least one mid-rarity card or better.</p>
      </section>
    </div>
  );
}
