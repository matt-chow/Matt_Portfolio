import type { CSSProperties } from 'react';
import type { PackDef } from '../engine/packs';
import { Motif } from './Art';

const emblem: Record<string, string> = {
  starter: 'document', experience: 'pipeline', highlights: 'trophy', skills: 'token', prototype: 'blocks', personal: 'stars',
};

/** Clip paths for the flat fallback, cut along the same jagged seam the 3D pack tears on, so top and body fit together. */
export function seamClips(points: number[]) {
  const pts = points.map((v, i) => `${(i / (points.length - 1)) * 100}% ${((1 - v) * 100).toFixed(2)}%`);
  return { top: `polygon(0 0,100% 0,${pts.slice().reverse().join(',')})`, body: `polygon(${pts.join(',')},100% 100%,0 100%)` };
}

/** WebGL2 runs the foil packs and the ring; without it the flat CSS packs stand in. */
export function canGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

export function PackArt({ pack, clip, style }: { pack: PackDef; clip?: string; style?: CSSProperties }) {
  const keyArt = pack.id !== 'starter'; // Starter stays the plain, minimal wrapper
  return (
    <div className={`pack pack-${pack.id}${keyArt ? ' has-key' : ''}`} style={{ clipPath: clip, ...style }} aria-hidden="true">
      {keyArt && <img className="pack-key" src={`art/pack-${pack.id}.webp`} alt="" decoding="async" />}
      <div className="pack-crimp" />
      <div className="pack-face">
        <span className="pack-series">{pack.series}</span>
        <Motif name={emblem[pack.id]} className="pack-emblem" />
        <strong className="pack-name">{pack.name}</strong>
        <span className="pack-sub">Matthew Chow</span>
      </div>
      <div className="pack-crimp bottom" />
      <div className="pack-foil" />
    </div>
  );
}
