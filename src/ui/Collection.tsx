import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cardById, cards, type CardContent } from '../content/manifest';
import { unlockedRewards } from '../engine/achievements';
import { packById, packs, parseKey, variantKey } from '../engine/packs';
import { parseState, setFlag } from '../engine/state';
import { act, getState, replaceState, useStore } from '../store';
import { Card } from './Card';
import { Slab } from './Slab';
import { useOpenDetail } from './App';

const TABS = [
  { id: 'grid', label: 'Grid' },
  { id: 'binder', label: 'Binder' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'favourites', label: 'Favourites' },
  { id: 'slabs', label: 'Slabs' },
];
const PER_PAGE = 9;

/** Best owned finish of a card (ungraded stacks only), or undefined. */
function bestTier(stacks: Record<string, number>, c: CardContent) {
  return [...packById.get(c.pack)!.tiers].reverse().find((t) => stacks[variantKey(c.id, t.id)]);
}

function CardTile({ c }: { c: CardContent }) {
  const s = useStore();
  const openDetail = useOpenDetail();
  const best = bestTier(s.stacks, c);
  const total = packById.get(c.pack)!.tiers.reduce((n, t) => n + (s.stacks[variantKey(c.id, t.id)] ?? 0), 0);
  const seen = Object.keys(s.discovered).some((k) => parseKey(k).cardId === c.id);
  if (!seen)
    return (
      <button className="card-btn silhouette" onClick={() => openDetail({ cardId: c.id })} aria-label={`${c.title}, not collected yet. Read it anyway`}>
        <span className="sil-card"><span>{c.title}</span></span>
      </button>
    );
  return (
    <button className="card-btn" onClick={() => openDetail({ cardId: c.id, tier: best?.id })} aria-label={`${c.title}${best ? `, best finish ${best.label}` : ''}, ${total} ungraded. Open details`}>
      <Card card={c} tier={best?.id ?? packById.get(c.pack)!.tiers[0].id} back={s.equipped.back} frame={s.equipped.frame} />
      {total > 1 && <span className="stack-count">×{total}</span>}
      {s.favourites.includes(c.id) && <span className="fav-pin" aria-hidden="true">★</span>}
    </button>
  );
}

function download() {
  const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `collectors-archive-${new Date().toISOString().slice(0, 10)}.json` });
  a.click();
  URL.revokeObjectURL(a.href);
  act((s) => setFlag(s, 'exported'));
}

export function Collection({ tab = 'grid', pack }: { tab?: string; pack?: string }) {
  const s = useStore();
  const reduce = useReducedMotion();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(pack ?? 'all');
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const [msg, setMsg] = useState('');
  const openDetail = useOpenDetail();
  const decor = unlockedRewards(s, 'decor');

  const list = cards.filter(
    (c) => (filter === 'all' || c.pack === filter) && (!q || `${c.title} ${c.subtitle ?? ''} ${c.summary} ${c.tags?.join(' ') ?? ''}`.toLowerCase().includes(q.toLowerCase())),
  );
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const pg = Math.min(page, pages - 1);
  const turn = (d: number) => (setDir(d), setPage(Math.max(0, Math.min(pages - 1, pg + d))));
  const found = cards.filter((c) => Object.keys(s.discovered).some((k) => parseKey(k).cardId === c.id)).length;

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const next = parseState(JSON.parse(await file.text()));
      if (!confirm('Replace your current collection with this file? This cannot be undone.')) return;
      replaceState(next);
      setMsg('Collection imported.');
    } catch {
      setMsg('That file is not a save exported from this site. Nothing was changed.');
    }
  };

  return (
    <div className="page collection">
      <div className="page-head">
        <div>
          <h1>Your binder</h1>
          <p className="muted">{found} of {cards.length} cards found · {Object.keys(s.discovered).length} finishes · {s.slabs.length} slabs</p>
        </div>
        <div className="row">
          {decor.map((d) => <span key={d.id} className={`sticker sticker-${d.id}`} title={d.label} aria-label={d.label} role="img" />)}
          <button className="btn btn-quiet" onClick={download}>Export JSON</button>
          <label className="btn btn-quiet">
            Import JSON
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => (importFile(e.target.files?.[0]), (e.target.value = ''))} />
          </label>
        </div>
      </div>
      <p role="status" className="small">{msg}</p>

      <div className="collection-bar">
        <nav className="tabs" aria-label="Collection views">
          {TABS.map((t) => (
            <a key={t.id} href={`#/collection/${t.id}${filter !== 'all' ? `?pack=${filter}` : ''}`} className="nav-pill" aria-current={tab === t.id ? 'page' : undefined}>
              {t.label}
            </a>
          ))}
        </nav>

        {(tab === 'grid' || tab === 'binder' || tab === 'checklist') && (
          <div className="filters">
            <label className="field">
              <span className="sr-only">Search cards</span>
              <input type="search" placeholder="Search cards" value={q} onChange={(e) => (setQ(e.target.value), setPage(0))} />
            </label>
            <label className="field">
              <span className="sr-only">Pack</span>
              <select value={filter} onChange={(e) => (setFilter(e.target.value), setPage(0))}>
                <option value="all">All packs</option>
                {packs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Only this scrolls; the head, tabs and filters above stay put. */}
      <div className={`collection-body scroll-y view-${tab}`}>
        {tab === 'grid' && (
          <ul className="card-grid">
            {list.map((c) => <li key={c.id}><CardTile c={c} /></li>)}
            {!list.length && <li className="empty">No cards match “{q}”.</li>}
          </ul>
        )}

        {tab === 'binder' && (
          <div className="binder">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.ul
                key={`${filter}-${pg}`}
                className="binder-page"
                initial={reduce ? false : { rotateY: dir * 70, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={reduce ? undefined : { rotateY: dir * -70, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.3, 0.6, 0.3, 1] }}
                aria-label={`Binder page ${pg + 1} of ${pages}`}
              >
                {Array.from({ length: PER_PAGE }, (_, i) => list[pg * PER_PAGE + i]).map((c, i) => (
                  <li key={c?.id ?? `empty-${i}`} className="pocket">{c ? <CardTile c={c} /> : <span className="pocket-empty" />}</li>
                ))}
              </motion.ul>
            </AnimatePresence>
            <div className="row center">
              <button className="btn btn-quiet" onClick={() => turn(-1)} disabled={pg === 0}>Previous page</button>
              <span className="mono small">{pg + 1} / {pages}</span>
              <button className="btn btn-quiet" onClick={() => turn(1)} disabled={pg >= pages - 1}>Next page</button>
            </div>
          </div>
        )}

        {tab === 'checklist' && (
          <div className="checklist">
            {packs.filter((p) => filter === 'all' || p.id === filter).map((p) => (
              <table key={p.id}>
                <caption>{p.name}</caption>
                <thead>
                  <tr><th scope="col">Card</th>{p.tiers.map((t) => <th key={t.id} scope="col">{t.label}</th>)}</tr>
                </thead>
                <tbody>
                  {list.filter((c) => c.pack === p.id).map((c) => (
                    <tr key={c.id}>
                      <th scope="row"><button className="linkish" onClick={() => openDetail({ cardId: c.id })}>{c.title}</button></th>
                      {p.tiers.map((t) => {
                        const k = variantKey(c.id, t.id);
                        const n = s.stacks[k] ?? 0;
                        const slabbed = s.slabs.filter((x) => x.cardId === c.id && x.tier === t.id).length;
                        return (
                          <td key={t.id} className={s.discovered[k] ? 'got' : ''}>
                            {s.discovered[k] ? <>✓{n > 0 && <span className="muted"> ×{n}</span>}{slabbed > 0 && <span className="muted"> +{slabbed} slab</span>}</> : <span className="sr-only">missing</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        )}

        {tab === 'favourites' && (
          <ul className="card-grid">
            {s.favourites.map((id) => cards.find((c) => c.id === id)).filter((c) => !!c).map((c) => <li key={c.id}><CardTile c={c} /></li>)}
            {!s.favourites.length && <li className="empty">No favourites yet. Open a card and press Favourite to pin it here.</li>}
          </ul>
        )}

        {tab === 'slabs' && (
          <ul className="slab-shelf">
            {[...s.slabs].reverse().map((x) => (
              <li key={x.id}>
                <button className="card-btn" onClick={() => openDetail({ cardId: x.cardId, tier: x.tier })} aria-label={`Open ${cardById.get(x.cardId)?.title} details`}>
                  <Slab slab={x} frame={s.equipped.frame} />
                </button>
              </li>
            ))}
            {!s.slabs.length && <li className="empty">No slabs yet. Open any card you own and press Grade one.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
