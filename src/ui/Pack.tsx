import type { CSSProperties } from 'react';
import type { PackDef } from '../engine/packs';
import { Motif } from './Art';

const emblem: Record<string, string> = {
  starter: 'document', experience: 'pipeline', highlights: 'trophy', skills: 'token', prototype: 'blocks', personal: 'stars',
};

// Zigzag tear line at 15% height; top and body clips share it so they fit together.
const zig = Array.from({ length: 13 }, (_, i) => [(i / 12) * 100, i % 2 ? 13 : 16.5]);
export const TEAR_TOP = `polygon(0 0,100% 0,${zig.slice().reverse().map(([x, y]) => `${x}% ${y}%`).join(',')})`;
export const TEAR_BODY = `polygon(${zig.map(([x, y]) => `${x}% ${y}%`).join(',')},100% 100%,0 100%)`;

export function PackArt({ pack, clip, style }: { pack: PackDef; clip?: string; style?: CSSProperties }) {
  return (
    <div className={`pack pack-${pack.id}`} style={{ clipPath: clip, ...style }} aria-hidden="true">
      <div className="pack-crimp" />
      <div className="pack-face">
        <span className="pack-series">{pack.series}</span>
        <Motif name={emblem[pack.id]} className="pack-emblem" />
        <strong className="pack-name">{pack.name}</strong>
        <span className="pack-sub">The Collector's Archive</span>
      </div>
      <div className="pack-crimp bottom" />
      <div className="pack-foil" />
    </div>
  );
}
