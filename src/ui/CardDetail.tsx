import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cardById, sourceLabel } from '../content/manifest';
import { packById, variantKey } from '../engine/packs';
import { gradeOne, markViewed, toggleFavourite, type Slab as SlabT } from '../engine/state';
import { act, actWith, useStore } from '../store';
import { sfx } from '../sound';
import { Card } from './Card';
import { gradeWord, Slab } from './Slab';

type Ceremony = { slab: SlabT; step: 'scan' | 'stamp' | 'slab' };

export function CardDetail({ cardId, tier, onClose }: { cardId: string; tier?: string; onClose: () => void }) {
  const s = useStore();
  const card = cardById.get(cardId)!;
  const pack = packById.get(card.pack)!;
  const reduce = useReducedMotion();
  const dialog = useRef<HTMLDialogElement>(null);
  const ownedTiers = pack.tiers.filter((t) => s.stacks[variantKey(cardId, t.id)]);
  const [sel, setSel] = useState(tier ?? ownedTiers.at(-1)?.id ?? pack.tiers[0].id);
  const [ceremony, setCeremony] = useState<Ceremony>();
  const timers = useRef<number[]>([]);
  const count = s.stacks[variantKey(cardId, sel)] ?? 0;
  const slabs = s.slabs.filter((x) => x.cardId === cardId);
  const fav = s.favourites.includes(cardId);

  useEffect(() => {
    dialog.current?.showModal();
    act((x) => markViewed(x, cardId));
    return () => timers.current.forEach(clearTimeout);
  }, [cardId]);

  const grade = () => {
    // Result is decided and saved before the ceremony plays; refreshing mid-ceremony loses nothing.
    const { slab } = actWith((x) => gradeOne(x, variantKey(cardId, sel), Math.random, crypto.randomUUID()));
    if (reduce) return setCeremony({ slab, step: 'slab' });
    setCeremony({ slab, step: 'scan' });
    [0, 400, 800, 1200, 1500].forEach((ms) => timers.current.push(window.setTimeout(sfx.tick, ms)));
    timers.current.push(window.setTimeout(() => (setCeremony({ slab, step: 'stamp' }), sfx.reveal(slab.grade === 8 ? 1 : 3)), 1800));
    timers.current.push(window.setTimeout(() => (setCeremony({ slab, step: 'slab' }), sfx.slab()), 3000));
  };

  return (
    <dialog ref={dialog} className="detail" onClose={onClose} onClick={(e) => e.target === dialog.current && dialog.current.close()} aria-labelledby="detail-title">
      <button className="icon-btn close" onClick={() => dialog.current?.close()} aria-label="Close">×</button>
      <div className="detail-grid">
        <div className="detail-visual">
          <AnimatePresence mode="wait">
            {ceremony ? (
              <motion.div key={ceremony.step} className={`ceremony step-${ceremony.step}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                {ceremony.step === 'slab' ? (
                  <motion.div initial={reduce ? false : { rotateX: 40, y: 60 }} animate={{ rotateX: 0, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
                    <Slab slab={ceremony.slab} frame={s.equipped.frame} />
                  </motion.div>
                ) : (
                  <div className="scan-wrap">
                    <Card card={card} tier={ceremony.slab.tier} tilt={false} className="card-lg" />
                    {ceremony.step === 'scan' && <div className="scanline" aria-hidden="true" />}
                    {ceremony.step === 'stamp' && (
                      <motion.div className="grade-stamp" initial={{ scale: 3, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                        <small>{gradeWord(ceremony.slab.grade)}</small>
                        <b>{ceremony.slab.grade === 'misprint' ? 'ERR' : ceremony.slab.grade}</b>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="card" initial={reduce ? false : { rotateY: -90 }} animate={{ rotateY: 0 }}>
                <Card card={card} tier={sel} back={s.equipped.back} frame={s.equipped.frame} className="card-lg" />
              </motion.div>
            )}
          </AnimatePresence>
          <p className="sr-only" aria-live="assertive">
            {ceremony?.step === 'slab' && `Graded: ${ceremony.slab.grade === 'misprint' ? 'misprint error card' : `grade ${ceremony.slab.grade}, ${gradeWord(ceremony.slab.grade)}`}. Slabbed.`}
          </p>
        </div>

        <div className="detail-text scroll-y" tabIndex={0} role="region" aria-labelledby="detail-title">
          <p className="muted small">{pack.name}{card.subset ? ` · ${card.subset}` : ''}</p>
          <h2 id="detail-title">{card.title}</h2>
          {card.subtitle && <p className="lede">{card.subtitle}</p>}
          {card.kicker && <p className="muted">{card.kicker}</p>}
          <p>{card.summary}</p>
          {card.details && <ul className="details">{card.details.map((d) => <li key={d}>{d}</li>)}</ul>}
          {card.tags && <p className="tags">{card.tags.map((t) => <span key={t} className="tag">{t}</span>)}</p>}
          {card.links && <p className="row">{card.links.map((l) => <a key={l.href} className="btn btn-quiet" href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{l.label}</a>)}</p>}

          <section className="variants" aria-label="Your copies">
            <h3>Your copies</h3>
            <div className="seg tiers" role="radiogroup" aria-label="Finish">
              {pack.tiers.map((t) => {
                const n = s.stacks[variantKey(cardId, t.id)] ?? 0;
                const seen = s.discovered[variantKey(cardId, t.id)];
                return (
                  <label key={t.id} className={seen ? '' : 'unseen'}>
                    <input type="radio" name="tier" checked={sel === t.id} onChange={() => (setSel(t.id), setCeremony(undefined))} />
                    <span>{t.label}{n > 0 && <em> ×{n}</em>}</span>
                  </label>
                );
              })}
            </div>
            <div className="row">
              <button className="btn" disabled={!count || (!!ceremony && ceremony.step !== 'slab')} onClick={grade}>
                Grade one{count ? ` (${count} left)` : ''}
              </button>
              <button className="btn btn-quiet" aria-pressed={fav} onClick={() => act((x) => toggleFavourite(x, cardId))}>
                {fav ? '★ Favourited' : '☆ Favourite'}
              </button>
            </div>
            <p className="small muted">
              {count ? 'Grading uses up one copy of this finish and seals it in a slab for good. Odds: 8 (25%), 9 (45%), 10 (29.9%), misprint (0.1%).' : 'No ungraded copy of this finish yet. Open more packs to grade one.'}
            </p>
            {slabs.length > 0 && <p className="small">{slabs.length} graded: {slabs.map((x) => (x.grade === 'misprint' ? 'misprint' : `grade ${x.grade}`)).join(', ')}</p>}
          </section>
          <p className="small muted source">Source: {sourceLabel(card.source)}</p>
        </div>
      </div>
    </dialog>
  );
}
