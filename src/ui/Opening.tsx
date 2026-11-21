import { useEffect, useRef, useState } from 'react';
import { animate, AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cardById, type PackId } from '../content/manifest';
import { cardsInPack, packById, tierIndex, type Pull } from '../engine/packs';
import { openPack } from '../engine/state';
import { actWith, useStore } from '../store';
import { sfx } from '../sound';
import { Card } from './Card';
import { PackArt, TEAR_BODY, TEAR_TOP } from './Pack';
import { go, useOpenDetail } from './App';

// NEW badges for the latest opening, keyed by its timestamp (not persisted; replays show none).
let freshFlags: { at: number; isNew: boolean[] } | undefined;

export function openAndGo(packId: PackId, quick = false) {
  const r = actWith((s) => openPack(s, packId, Math.random));
  freshFlags = { at: r.state.lastOpening!.at, isNew: r.isNew };
  if (quick) go(`/open/${packId}?quick`);
  return r;
}

type Stage = 'sealed' | 'tearing' | 'reveal' | 'summary';

export function Opening({ packId, quick }: { packId: PackId; quick: boolean }) {
  const s = useStore();
  const pack = packById.get(packId);
  const reduce = useReducedMotion();
  const openDetail = useOpenDetail();
  const last = s.lastOpening?.packId === packId ? s.lastOpening : undefined;
  const [stage, setStage] = useState<Stage>(quick && last ? 'summary' : 'sealed');
  const [pulls, setPulls] = useState<Pull[]>(quick && last ? last.pulls : []);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [charging, setCharging] = useState(false);
  const [announce, setAnnounce] = useState('');
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, reduce ? 0 : ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!pack) return <p className="page">That pack does not exist. <a href="#/">Back to packs</a></p>;
  const first = !s.opened[packId];
  const isNew = (i: number) => !!(last && freshFlags?.at === last.at && freshFlags.isNew[i]);

  const play = (p: Pull[]) => {
    setPulls(p);
    setIdx(0);
    setFlipped(false);
    setStage('tearing');
    sfx.tear();
    later(() => setStage('reveal'), 1500);
  };
  const tear = () => play(openAndGo(packId).pulls);
  const quickOpen = () => {
    setPulls(openAndGo(packId).pulls);
    setStage('summary');
  };

  const current = pulls[idx];
  const rank = current ? tierIndex(pack, current.tier) : 0;
  const advance = () => {
    if (charging || !current) return;
    if (flipped) {
      if (idx + 1 >= pulls.length) return setStage('summary');
      setIdx(idx + 1);
      return setFlipped(false);
    }
    const reveal = () => {
      setCharging(false);
      setFlipped(true);
      sfx.flip();
      sfx.reveal(rank);
      const c = cardById.get(current.cardId)!;
      setAnnounce(`${c.title}, ${pack.tiers[rank].label}${isNew(idx) ? ', new' : ''}. Card ${idx + 1} of ${pulls.length}.`);
    };
    if (rank >= pack.guaranteeFrom && !reduce) {
      setCharging(true);
      [0, 250, 500, 700].forEach((ms) => later(sfx.tick, ms));
      later(reveal, 900);
    } else reveal();
  };

  const fileInBinder = async () => {
    const target = document.querySelector('[data-binder-target]')?.getBoundingClientRect();
    const els = [...document.querySelectorAll<HTMLElement>('.summary-grid .pull')];
    if (target && !reduce) {
      await Promise.all(
        els.map((el, i) => {
          const r = el.getBoundingClientRect();
          return animate(
            el,
            { x: target.left + target.width / 2 - (r.left + r.width / 2), y: target.top + target.height / 2 - (r.top + r.height / 2), scale: 0.08, opacity: 0.2 },
            { duration: 0.55, delay: i * 0.05, ease: [0.5, 0, 0.75, 0] },
          );
        }),
      );
    }
    go(`/collection/binder?pack=${packId}`);
  };

  return (
    <div className={`opening opening-${packId}`}>
      <p className="sr-only" aria-live="polite">{announce}</p>
      <div className="opening-head">
        <a href="#/" className="btn btn-quiet">← Packs</a>
        <h1>{pack.name} pack</h1>
        {(stage === 'reveal' || stage === 'tearing') && (
          <button className="btn btn-quiet" onClick={() => setStage('summary')}>Skip to all cards</button>
        )}
      </div>

      {stage === 'sealed' && (
        <div className="stage">
          <motion.button
            className="sealed"
            onClick={tear}
            aria-label={`Tear open the ${pack.name} pack`}
            initial={reduce ? false : { scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={reduce ? undefined : { rotate: [-1, 1.5, -1, 0], transition: { duration: 0.5 } }}
            whileTap={{ scale: 0.97 }}
          >
            <PackArt pack={pack} />
          </motion.button>
          <p className="stage-note">
            {first ? `First opening: all ${cardsInPack(packId).length} cards, one by one, straight into your binder.` : `${s.settings.packSize} random cards, at least one ${pack.tiers[pack.guaranteeFrom].label} or better.`}
          </p>
          <div className="row">
            <button className="btn" onClick={tear}>Tear open</button>
            <button className="btn btn-quiet" onClick={quickOpen}>Quick open</button>
            {last && <button className="btn btn-quiet" onClick={() => play(last.pulls)}>Replay last opening</button>}
          </div>
        </div>
      )}

      {stage === 'tearing' && (
        <div className="stage tearing" aria-hidden="true">
          <div className="tear-wrap">
            <motion.div className="tear-layer" initial={{ y: 0 }} animate={{ y: '120%', opacity: 0 }} transition={{ delay: 0.95, duration: 0.5, ease: 'easeIn' }}>
              <PackArt pack={pack} clip={TEAR_BODY} />
            </motion.div>
            <motion.div className="stack-rise" initial={{ y: '30%' }} animate={{ y: '-8%' }} transition={{ delay: 0.45, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}>
              <div className="mini-back" /><div className="mini-back" /><div className="mini-back" />
            </motion.div>
            <motion.div className="tear-layer top" initial={{ x: 0, y: 0, rotate: 0 }} animate={{ x: 90, y: -160, rotate: 24, opacity: 0 }} transition={{ duration: 0.7, ease: [0.3, 0.6, 0.3, 1] }}>
              <PackArt pack={pack} clip={TEAR_TOP} />
            </motion.div>
          </div>
        </div>
      )}

      {stage === 'reveal' && current && (
        <div className="stage reveal">
          <div className={`reveal-zone ${charging ? 'charging' : ''}`} style={{ '--rank': rank } as React.CSSProperties}>
            <div className="stack-behind" aria-hidden="true">
              {pulls.slice(idx + 1, idx + 4).map((_, i) => <div key={i} className="mini-back" style={{ transform: `translate(${(i + 1) * 6}px, ${(i + 1) * -6}px)` }} />)}
            </div>
            <AnimatePresence mode="popLayout">
              <motion.button
                key={idx}
                className="reveal-card"
                onClick={advance}
                autoFocus
                aria-label={flipped ? (idx + 1 < pulls.length ? 'Next card' : 'See all cards') : `Reveal card ${idx + 1} of ${pulls.length}`}
                initial={reduce ? false : { y: 40, scale: 0.92, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={reduce ? undefined : { x: -260, y: 120, scale: 0.4, opacity: 0, rotate: -12 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              >
                <Card card={cardById.get(current.cardId)!} tier={current.tier} back={s.equipped.back} faceDown={!flipped} className="card-lg" />
                {flipped && isNew(idx) && <span className="badge-new">New</span>}
              </motion.button>
            </AnimatePresence>
          </div>
          <p className="stage-note">
            {flipped ? <><strong>{pack.tiers[rank].label}</strong> · card {idx + 1} of {pulls.length}</> : charging ? 'Something shiny…' : `Tap the card or press Enter · ${pulls.length - idx} left`}
          </p>
        </div>
      )}

      {stage === 'summary' && (
        <div className="summary">
          <ul className="summary-grid">
            {pulls.map((p, i) => {
              const c = cardById.get(p.cardId)!;
              const tier = pack.tiers.find((t) => t.id === p.tier)!;
              return (
                <motion.li key={i} className="pull" initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <button className="card-btn" onClick={() => openDetail({ cardId: p.cardId, tier: p.tier })} aria-label={`${c.title}, ${tier.label}. Open details`}>
                    <Card card={c} tier={p.tier} frame={s.equipped.frame} />
                  </button>
                  <span className="pull-tier">{tier.label}{isNew(i) && <span className="badge-new inline">New</span>}</span>
                </motion.li>
              );
            })}
          </ul>
          <div className="row center">
            <button className="btn" onClick={fileInBinder}>File in binder</button>
            <button className="btn btn-quiet" onClick={tear}>Open another</button>
            <button className="btn btn-quiet" onClick={() => play(pulls)}>Replay</button>
          </div>
        </div>
      )}
    </div>
  );
}
