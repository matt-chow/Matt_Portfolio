import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { CardContent } from '../content/manifest';
import { cardsInPack, packById } from '../engine/packs';
import { Motif } from './Art';

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Pointer-driven tilt + light position, written straight to CSS variables (no React renders per frame). */
export function useTilt(ref: React.RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || reducedMotion()) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.classList.add('is-active');
        el.style.setProperty('--px', `${x * 100}%`);
        el.style.setProperty('--py', `${y * 100}%`);
        el.style.setProperty('--rx', `${(0.5 - y) * 22}deg`);
        el.style.setProperty('--ry', `${(x - 0.5) * 26}deg`);
        el.style.setProperty('--hyp', `${Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 2)}`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      el.classList.remove('is-active');
      ['--px', '--py', '--rx', '--ry', '--hyp'].forEach((p) => el.style.removeProperty(p));
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointercancel', leave);
    return () => {
      leave();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointercancel', leave);
    };
  }, [ref, enabled]);
}

const num = (c: CardContent) => {
  const list = cardsInPack(c.pack);
  return `${String(list.indexOf(c) + 1).padStart(3, '0')}/${String(list.length).padStart(3, '0')}`;
};

function ArtWindow({ c, children }: { c: CardContent; children?: ReactNode }) {
  return (
    <div className="art">
      <div className="art-bg" />
      {c.image ? <img className="art-img" src={c.image} alt="" loading="lazy" decoding="async" /> : <Motif name={c.motif} className="art-motif" />}
      {children}
      <div className="shine art-shine" />
    </div>
  );
}

// Short single words stay whole (R, SQL, Rust); others become initials (Delta Lake → DL) or two letters (Python → Py).
const glyph = (title: string) => {
  const words = title.split(/[\s&·.]+/).filter(Boolean);
  if (words.length === 1) return words[0].length <= 4 ? words[0] : words[0].slice(0, 2);
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
};

function Front({ c }: { c: CardContent }) {
  switch (c.pack) {
    case 'starter':
      return (
        <>
          <header className="st-head"><span>{c.kicker}</span><span className="num">{num(c)}</span></header>
          <ArtWindow c={{ ...c, image: undefined }} />
          <h3 className="name">{c.title}</h3>
          <p className="sub">{c.subtitle}</p>
          <p className="sum">{c.summary}</p>
        </>
      );
    case 'experience':
      return (
        <>
          <header className="ex-head"><span className="ex-stage">{c.subset}</span><h3 className="name">{c.title}</h3></header>
          <ArtWindow c={c} />
          <p className="ex-role">{c.subtitle}<span>{c.kicker}</span></p>
          <p className="sum ex-move">{c.summary}</p>
          <footer className="ex-foot"><span>{c.tags?.slice(0, 3).join(' / ')}</span><span className="num">{num(c)}</span></footer>
        </>
      );
    case 'highlights':
      return (
        <>
          <ArtWindow c={c} />
          <div className="hl-flag">{c.kicker?.split(' ')[0]}</div>
          <div className="hl-banner"><h3 className="name">{c.title}</h3></div>
          <p className="sub hl-sub">{c.subtitle}</p>
          <span className="num">{num(c)}</span>
        </>
      );
    case 'skills':
      return (
        <>
          <div className="tk-coin"><div className="tk-enamel"><span className="tk-glyph">{glyph(c.title)}</span><div className="shine" /></div></div>
          <h3 className="name">{c.title}</h3>
          <p className="sub">{c.kicker}</p>
          <span className="num">{num(c)}</span>
        </>
      );
    case 'prototype':
      return (
        <>
          <div className="pr-stamp" aria-hidden="true">Prototype · not final</div>
          <h3 className="name">{c.title}</h3>
          <ArtWindow c={{ ...c, image: undefined }} />
          <p className="sum">{c.summary}</p>
          <footer className="pr-foot"><span>{c.kicker}</span><span className="num">{num(c)}</span></footer>
        </>
      );
    case 'personal':
      return (
        <>
          <ArtWindow c={c}><span className="tape" /></ArtWindow>
          <h3 className="name">{c.title}</h3>
          <p className="sum">{c.summary}</p>
          <span className="ps-tag">{c.kicker}</span>
        </>
      );
  }
}

export interface CardProps {
  card: CardContent;
  tier: string;
  back?: string;
  frame?: string;
  faceDown?: boolean;
  misprint?: boolean;
  tilt?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Visual card. Wrap in a button/link for interaction; the label lives on the wrapper. */
export function Card({ card, tier, back = 'classic', frame = 'none', faceDown, misprint, tilt = true, className = '', style }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref, tilt && !faceDown);
  const tierLabel = packById.get(card.pack)!.tiers.find((t) => t.id === tier)?.label;
  return (
    <div
      ref={ref}
      className={`card tpl-${card.pack} fin-${tier} frame-${frame} ${misprint ? 'misprint' : ''} ${faceDown ? 'face-down' : ''} ${className}`}
      style={{ '--hue': card.hue, ...style } as CSSProperties}
      data-tier={tierLabel}
    >
      <div className="card-rot">
        <div className="face front">
          <Front c={card} />
          <div className="shine card-shine" />
          <div className="glare" />
        </div>
        <div className={`face back back-${back}`}>
          <div className="back-emblem"><span>The Collector's</span><strong>Archive</strong></div>
          <div className="glare" />
        </div>
      </div>
    </div>
  );
}
