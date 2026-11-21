import { useEffect, useRef, useState } from 'react';
import { animate, AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cardById, type PackId } from '../content/manifest';
import { cardsInPack, PACK_SIZE, packById, tierIndex, type Pull } from '../engine/packs';
import { openPack } from '../engine/state';
import { actWith, useStore } from '../store';
import { sfx } from '../sound';
import { Card } from './Card';
import { TearPack } from './TearPack';
import { go, useOpenDetail } from './App';
import { PACK_CATEGORY } from './Collection';

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
  const [round, setRound] = useState(0); // remounts a fresh sealed pack
  const [auto, setAuto] = useState(false);
  const replay = useRef<Pull[] | undefined>(undefined);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, reduce ? 0 : ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!pack) return <p className="page">That pack does not exist. <a href="#/">Back to packs</a></p>;
  const first = !s.opened[packId];
  const isNew = (i: number) => !!(last && freshFlags?.at === last.at && freshFlags.isNew[i]);

  // The pack is rolled (and saved) the moment the tear completes, or up front for a replay or the Tear open button.
  const commit = () => {
    if (stage !== 'sealed') return;
    setPulls(replay.current ?? openAndGo(packId).pulls);
    replay.current = undefined;
    setIdx(0);
    setFlipped(false);
    setStage('tearing');
  };
  const reseal = (p?: Pull[], autoTear = false) => {
    replay.current = p;
    setRound((r) => r + 1);
    setAuto(autoTear);
    setStage('sealed');
  };
  const tear = () => {
    commit();
    setAuto(true);
  };
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
      // Scroll panels would clip cards flying up to the nav, so let them overflow for the flight (rects are read after this).
      document.documentElement.classList.add('is-filing');
      await Promise.all(
        els.map((el, i) => {
          const r = el.getBoundingClientRect();
          return animate(
            el,
            { x: target.left + target.width / 2 - (r.left + r.width / 2), y: target.top + target.height / 2 - (r.top + r.height / 2), scale: 0.08, opacity: 0.2 },
            { duration: 0.55, delay: i * 0.05, ease: [0.5, 0, 0.75, 0] },
          );
        }),
      ).finally(() => document.documentElement.classList.remove('is-filing'));
    }
    go(`/collection/binder?cat=${PACK_CATEGORY[packId]}`);
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

      {(stage === 'sealed' || stage === 'tearing') && (
        // One pack across both stages, so the drag that tears it flows straight into the separation. Tap to skip once torn.
        <div className={`stage ${stage === 'tearing' ? 'tearing' : ''}`} onClick={stage === 'tearing' ? () => setStage('reveal') : undefined}>
          <motion.div className="tear-enter" initial={reduce ? false : { scale: 0.9, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0, duration: 0.5 }}>
            <TearPack key={round} pack={pack} auto={auto} reduce={!!reduce} onTorn={commit} onDone={() => setStage((x) => (x === 'tearing' ? 'reveal' : x))} />
          </motion.div>
          <p className="stage-note">
            {stage === 'tearing'
              ? 'Tap to skip'
              : <>Drag the top strip to tear.<br />{first && pack.core ? `All ${cardsInPack(packId).length} cards, plus one or two ${pack.tiers[pack.premiumFrom].label} or better.` : `${PACK_SIZE} cards, at least one ${pack.tiers[pack.guaranteeFrom].label} or better.`}</>}
          </p>
          <div className="row" style={{ visibility: stage === 'sealed' && !auto ? 'visible' : 'hidden' }}>
            <button className="btn" onClick={tear}>Tear open</button>
            <button className="btn btn-quiet" onClick={quickOpen}>Quick open</button>
            {last && <button className="btn btn-quiet" onClick={() => reseal(last.pulls, true)}>Replay last opening</button>}
          </div>
        </div>
      )}

      {stage === 'reveal' && current && (
        <div className="stage reveal">
          <div className={`reveal-zone ${charging ? 'charging' : ''}`} style={{ '--rank': rank } as React.CSSProperties}>
            <div className="stack-behind" aria-hidden="true">
              {/* Keyed by absolute position so the waiting cards glide forward as the top one leaves. */}
              {pulls.slice(idx + 1, idx + 4).map((_, i) => (
                <motion.div
                  key={idx + 1 + i}
                  className="mini-back"
                  initial={false}
                  animate={{ x: (i + 1) * 6, y: (i + 1) * -6, scale: 1 - (i + 1) * 0.015 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.05 + i * 0.04 }}
                />
              ))}
            </div>
            {flipped && rank >= pack.guaranteeFrom && !reduce && (
              <motion.div key={`burst-${idx}`} className="reveal-burst" aria-hidden="true" initial={{ opacity: 0.95, scale: 0.55 }} animate={{ opacity: 0, scale: 1.5 + rank * 0.12 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
            )}
            <AnimatePresence mode="popLayout">
              {/* Next card: the old one winds up and flies off on top while the new one slides out from the stack beneath. */}
              <motion.button
                key={idx}
                className="reveal-card"
                onClick={advance}
                autoFocus
                aria-label={flipped ? (idx + 1 < pulls.length ? 'Next card' : 'See all cards') : `Reveal card ${idx + 1} of ${pulls.length}`}
                style={{ zIndex: 2 }}
                initial={reduce ? false : { x: 6, y: -6, scale: 0.97 }}
                animate={flipped && !reduce ? { x: 0, y: [0, -18, 0], scale: [1, 1.07, 1] } : { x: 0, y: 0, scale: 1 }}
                exit={
                  reduce
                    ? undefined
                    : { x: [0, 14, -440], y: [0, -12, 70], rotate: [0, 3, -16], scale: [1, 1.03, 0.85], opacity: 0, zIndex: 3, transition: { duration: 0.5, times: [0, 0.2, 1], ease: [0.45, 0, 0.2, 1], opacity: { delay: 0.3, duration: 0.2 } } }
                }
                transition={flipped ? { duration: 0.6, times: [0, 0.45, 1], ease: [0.2, 0.8, 0.2, 1] } : { type: 'spring', stiffness: 340, damping: 24, delay: 0.08 }}
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
          <ul className="summary-grid scroll-y">
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
            <button className="btn btn-quiet" onClick={() => reseal()}>Open another</button>
            <button className="btn btn-quiet" onClick={() => reseal(pulls, true)}>Replay</button>
          </div>
        </div>
      )}
    </div>
  );
}
