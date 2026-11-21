import { useRef } from 'react';
import { cardById } from '../content/manifest';
import { packById } from '../engine/packs';
import type { Grade, Slab as SlabT } from '../engine/state';
import { Card, useTilt } from './Card';

export const gradeWord = (g: Grade) => (g === 'misprint' ? 'Error' : g === 10 ? 'Gem Mint' : g === 9 ? 'Mint' : 'NM-MT');

export function Slab({ slab, frame }: { slab: SlabT; frame?: string }) {
  const card = cardById.get(slab.cardId)!;
  const pack = packById.get(card.pack)!;
  const tier = pack.tiers.find((t) => t.id === slab.tier)?.label;
  const ref = useRef<HTMLElement>(null);
  useTilt(ref);
  return (
    <figure ref={ref} className={`slab grade-${slab.grade}`} aria-label={`${card.title}, ${tier}, ${slab.grade === 'misprint' ? 'misprint' : `grade ${slab.grade}`}`}>
      <figcaption className="slab-label">
        <div className="slab-meta">
          <strong>{card.title}</strong>
          <span>{tier} · {pack.name}</span>
          <span className="mono">Cert {slab.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="slab-grade">
          <small>{gradeWord(slab.grade)}</small>
          <b>{slab.grade === 'misprint' ? 'ERR' : slab.grade}</b>
        </div>
      </figcaption>
      <div className="slab-well">
        <Card card={card} tier={slab.tier} frame={frame} misprint={slab.grade === 'misprint'} tilt={false} />
      </div>
      <div className="slab-sheen" aria-hidden="true" />
    </figure>
  );
}
