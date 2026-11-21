import { useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cardById, cards, type CardContent, type PackId } from '../content/manifest';
import { unlockedRewards } from '../engine/achievements';
import { packById, packs, parseKey, variantKey } from '../engine/packs';
import { useStore } from '../store';
import { Card } from './Card';
import { Slab } from './Slab';
import { Icon } from './Icons';
import { useOpenDetail } from './App';

const TABS = [
  { id: 'grid', label: 'Grid', icon: 'grid' },
  { id: 'binder', label: 'Binder', icon: 'binder' },
  { id: 'checklist', label: 'Checklist', icon: 'checklist' },
  { id: 'favourites', label: 'Favourites', icon: 'star' },
  { id: 'slabs', label: 'Slabs', icon: 'slab' },
] as const;
const PER_PAGE = 9;

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'research', label: 'Research' },
  { id: 'skills', label: 'Skills' },
  { id: 'other', label: 'Other' },
] as const;
export type Category = (typeof CATEGORIES)[number]['id'];

/** Portfolio category, independent of the pack a card comes from (Highlights holds both projects and research). */
export function category(c: CardContent): Category {
  if (c.pack === 'experience' || c.pack === 'skills') return c.pack;
  if (c.pack === 'highlights') return c.kicker === 'Publication' || c.kicker === 'Presentation' ? 'research' : 'projects';
  return c.pack === 'prototype' ? 'projects' : 'other';
}

/** Default order: featured work first, archive material last. Lower is earlier. */
export function relevance(c: CardContent) {
  if (c.subset === 'Featured' || c.pack === 'highlights') return 0;
  if (c.pack === 'skills') return 1;
  if (c.subset === 'Supplemental' || c.pack === 'starter') return 2;
  if (c.pack === 'prototype') return 3;
  return 4; // Career Foundations, Personal
}

/** Where to land after opening a pack. Highlights spans two categories, so it shows everything. */
export const PACK_CATEGORY: Record<PackId, Category> = {
  starter: 'other', experience: 'experience', highlights: 'all', skills: 'skills', prototype: 'projects', personal: 'other',
};

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'recent', label: 'Recently found' },
  { id: 'az', label: 'A–Z' },
] as const;
type Sort = (typeof SORTS)[number]['id'];

/** Sort picker. The list opens as a manual popover in the browser's top layer, so no toolbar, tooltip,
 *  card or scroll panel can cover or clip it; it is placed beside its trigger and kept on screen. */
function SortMenu({ value, onChange }: { value: Sort; onChange: (v: Sort) => void }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const close = (refocus: boolean) => (setOpen(false), refocus && btn.current?.focus());
  const pick = (v: Sort) => (onChange(v), close(true));

  useLayoutEffect(() => {
    const m = menu.current, b = btn.current;
    if (!open || !m || !b) return;
    m.showPopover();
    const r = b.getBoundingClientRect();
    m.style.minWidth = `${r.width}px`;
    const below = r.bottom + 6 + m.offsetHeight <= innerHeight - 8;
    m.style.left = `${Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8))}px`;
    m.style.top = `${below ? r.bottom + 6 : Math.max(8, r.top - 6 - m.offsetHeight)}px`;
    m.dataset.side = below ? 'bottom' : 'top';
    m.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    // Anything that would move the trigger out from under the list closes it instead.
    const away = (e: Event) => !(e.target instanceof Node && m.contains(e.target)) && close(false);
    addEventListener('resize', away);
    addEventListener('scroll', away, true);
    return () => (removeEventListener('resize', away), removeEventListener('scroll', away, true));
  }, [open]);

  const keys = (e: KeyboardEvent<HTMLUListElement>) => {
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
    if (to !== undefined) items[(to + items.length) % items.length].focus();
    else if (e.key === 'Enter' || e.key === ' ') pick(SORTS[i].id);
    else if (e.key === 'Escape') close(true);
    else return;
    e.preventDefault();
  };

  return (
    <div className="sort">
      <button
        ref={btn}
        type="button"
        className="sort-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sort by: ${SORTS.find((x) => x.id === value)!.label}`}
        onMouseDown={(e) => open && e.preventDefault()} // keep focus in the list, so its blur doesn't close it before this click toggles
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => (e.key === 'ArrowDown' || e.key === 'ArrowUp') && (e.preventDefault(), setOpen(true))}
      >
        <Icon name="sort" />
        {/* Every label shares one grid cell, so the button keeps the width of the longest. */}
        <span className="sort-label">{SORTS.map((x) => <span key={x.id} className={x.id === value ? '' : 'ghost'}>{x.label}</span>)}</span>
        <Icon name="chevron" />
      </button>
      {open && (
        <ul
          ref={menu}
          popover="manual"
          role="listbox"
          aria-label="Sort by"
          className="menu"
          onKeyDown={keys}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && e.relatedTarget !== btn.current && close(false)}
        >
          {SORTS.map((x) => (
            <li key={x.id} role="option" tabIndex={-1} aria-selected={x.id === value} onClick={() => pick(x.id)}>
              {x.label}
              <Icon name="check" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** First time any finish of each card was found. */
function foundAt(discovered: Record<string, number>) {
  const at = new Map<string, number>();
  for (const [k, t] of Object.entries(discovered)) {
    const id = parseKey(k).cardId;
    at.set(id, Math.min(at.get(id) ?? Infinity, t));
  }
  return at;
}

/** Best owned finish of a card (ungraded stacks only), or undefined. */
function bestTier(stacks: Record<string, number>, c: CardContent) {
  return [...packById.get(c.pack)!.tiers].reverse().find((t) => stacks[variantKey(c.id, t.id)]);
}

/** Every card has a slot and opens its details; its art only shows once collected. */
function CardTile({ c, found }: { c: CardContent; found: boolean }) {
  const s = useStore();
  const openDetail = useOpenDetail();
  const best = bestTier(s.stacks, c);
  const total = packById.get(c.pack)!.tiers.reduce((n, t) => n + (s.stacks[variantKey(c.id, t.id)] ?? 0), 0);
  const fav = s.favourites.includes(c.id);
  return (
    <button
      className="card-btn"
      onClick={() => openDetail({ cardId: c.id, tier: best?.id })}
      aria-label={`${c.title}${found ? (total > 1 ? `, ${total} copies` : '') : ', not collected yet'}${fav ? ', favourite' : ''}. Open details`}
    >
      {found ? (
        <Card card={c} tier={best?.id ?? packById.get(c.pack)!.tiers[0].id} back={s.equipped.back} frame={s.equipped.frame} />
      ) : (
        <span className="card-slot">
          <Icon name="lock" />
          <span>{c.title}</span>
        </span>
      )}
      {total > 1 && <span className="tile-badge">×{total}</span>}
      {fav && <span className="fav-pin" aria-hidden="true">★</span>}
    </button>
  );
}

const SPREAD = '(min-width: 900px)';
const subscribe = (cb: () => void) => {
  const m = matchMedia(SPREAD);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

/** A ring binder of double-sided sleeve sheets. Side i is page i + 1: even sides are sheet fronts, odd sides their backs.
    Wide screens open to a spread (one sheet's back beside the next sheet's front); narrow screens show one side at a time. */
function Binder({ list, at, empty }: { list: CardContent[]; at: Map<string, number>; empty?: string }) {
  const reduce = useReducedMotion();
  const spread = useSyncExternalStore(subscribe, () => matchMedia(SPREAD).matches);
  const n = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const [side, setSide] = useState(0);
  const [flip, setFlip] = useState<{ id: number; dir: 1 | -1 }>();
  const x0 = useRef<number>(undefined);
  const swiped = useRef(false);

  const cur = Math.min(side, n - 1);
  const step = spread ? 2 : 1;
  const pos = spread ? Math.ceil(cur / 2) : cur;
  const last = spread ? Math.ceil((n - 1) / 2) : n - 1;
  const right = spread ? 2 * pos : cur;
  const go = (d: 1 | -1) => {
    if (pos + d < 0 || pos + d > last) return;
    setSide(right + d * step);
    if (!reduce) setFlip({ id: performance.now(), dir: d });
  };

  // While a leaf turns, the pages beneath show what it uncovers; the side it lands on stays put until it lands.
  const fwd = flip?.dir === 1;
  const back = flip?.dir === -1;
  const leaf = fwd ? right - step : right;
  const shown = spread ? [right - 1 - (fwd ? 2 : 0), right + (back ? 2 : 0)] : [right + (back ? 1 : 0)];
  const pageLabel = (i: number) => `Page ${i + 1} of ${n}, sheet ${(i >> 1) + 1} ${i % 2 ? 'back' : 'front'}`;

  const sheet = (i: number) =>
    i < 0 || i >= n + (n % 2) ? (
      <div className="board" aria-hidden="true"><span>MC</span></div>
    ) : (
      <ul className="sheet" aria-label={pageLabel(i)}>
        {Array.from({ length: PER_PAGE }, (_, k) => list[i * PER_PAGE + k]).map((c, k) => (
          <li key={c?.id ?? `empty-${k}`} className="pocket">{c ? <CardTile c={c} found={at.has(c.id)} /> : <span className="pocket-empty" />}</li>
        ))}
        <li className="folio" aria-hidden="true">{i + 1}</li>
      </ul>
    );

  const visible = spread ? [right - 1, right].filter((i) => i >= 0 && i < n) : [cur];
  return (
    <section
      className="binder"
      aria-label="Binder"
      onKeyDown={(e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        go(e.key === 'ArrowRight' ? 1 : -1);
      }}
    >
      {empty && <p className="empty">{empty}</p>}
      <div
        className={`book ${spread ? 'is-spread' : 'is-single'}`}
        onPointerDown={(e) => ((x0.current = e.clientX), (swiped.current = false))}
        onPointerUp={(e) => {
          const dx = e.clientX - (x0.current ?? e.clientX);
          if (Math.abs(dx) > 40) (swiped.current = true), go(dx < 0 ? 1 : -1);
        }}
        // A swipe that ends on a card turns the page instead of opening it.
        onClickCapture={(e) => swiped.current && (e.stopPropagation(), (swiped.current = false))}
      >
        {spread && <div className="page-l">{sheet(shown[0])}</div>}
        <div className="spine" aria-hidden="true"><i /><i /><i /></div>
        <div className="page-r">{sheet(shown.at(-1)!)}</div>
        {flip && (
          <motion.div
            key={flip.id}
            className="leaf"
            aria-hidden="true"
            inert
            initial={{ rotateY: fwd ? 0 : -180 }}
            animate={{ rotateY: fwd ? -180 : 0 }}
            transition={{ duration: 0.62, ease: [0.645, 0.045, 0.355, 1] }}
            onAnimationComplete={() => setFlip(undefined)}
          >
            <div className="face">{sheet(leaf)}</div>
            {spread && <div className="face face-back">{sheet(leaf + 1)}</div>}
          </motion.div>
        )}
      </div>
      <div className="binder-nav">
        <button className="icon-btn icon-sm" onClick={() => go(-1)} disabled={pos === 0} aria-label="Previous page"><Icon name="prev" /></button>
        <p className="binder-where" aria-live="polite">
          <span className="mono">{visible.map((i) => i + 1).join('–')}</span> <span className="muted">of {n}</span>
          <span className="sr-only">. {visible.map(pageLabel).join('; ')}</span>
        </p>
        <button className="icon-btn icon-sm" onClick={() => go(1)} disabled={pos >= last} aria-label="Next page"><Icon name="next" /></button>
      </div>
    </section>
  );
}

export function Collection({ tab = 'grid', cat: initialCat }: { tab?: string; cat?: string }) {
  const s = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category>(CATEGORIES.some((x) => x.id === initialCat) ? (initialCat as Category) : 'all');
  const [sort, setSort] = useState<Sort>('featured');
  const openDetail = useOpenDetail();
  const decor = unlockedRewards(s, 'decor');

  const at = foundAt(s.discovered);
  const needle = q.trim().toLowerCase();
  const matches = (c: CardContent) =>
    (cat === 'all' || category(c) === cat) &&
    (!needle || `${c.title} ${c.subtitle ?? ''} ${c.kicker ?? ''} ${c.summary} ${c.tags?.join(' ') ?? ''}`.toLowerCase().includes(needle));
  const order: Record<Sort, (a: CardContent, b: CardContent) => number> = {
    featured: (a, b) => relevance(a) - relevance(b),
    recent: (a, b) => (at.get(b.id) ?? -1) - (at.get(a.id) ?? -1) || relevance(a) - relevance(b),
    az: (a, b) => a.title.localeCompare(b.title),
  };
  const list = cards.filter(matches).sort(order[sort]); // filter copies, so sorting never touches the manifest

  const favs = list.filter((c) => s.favourites.includes(c.id));
  const slabs = [...s.slabs].reverse().filter((x) => matches(cardById.get(x.cardId)!));
  const noMatch = needle ? `No cards match “${q.trim()}”.` : 'No cards in this category.';

  return (
    <div className="page collection">
      <div className="collection-head">
        <h1>Binder</h1>
        <p className="muted small">{at.size}/{cards.length} collected</p>
        {decor.map((d) => <span key={d.id} className={`sticker sticker-${d.id}`} title={d.label} aria-label={d.label} role="img" />)}
        <nav className="view-switch" aria-label="Collection views" style={{ '--i': TABS.findIndex((t) => t.id === tab) } as CSSProperties}>
          {/* One raised capsule that slides to the current view, rather than five separate backgrounds. */}
          <span className="view-pill" aria-hidden="true" hidden={!TABS.some((t) => t.id === tab)} />
          {TABS.map((t) => (
            <a key={t.id} href={`#/collection/${t.id}${cat !== 'all' ? `?cat=${cat}` : ''}`} className="chip chip-icon" aria-label={t.label} data-tip={t.label} aria-current={tab === t.id ? 'page' : undefined}>
              <Icon name={t.icon} />
            </a>
          ))}
        </nav>
      </div>

      <div className="collection-bar">
        <div className="pack-picker cat-row" role="group" aria-label="Category">
          {CATEGORIES.map((x) => (
            <button key={x.id} className="chip" aria-pressed={cat === x.id} onClick={() => setCat(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
        <label className="search">
          <Icon name="search" />
          <span className="sr-only">Search cards</span>
          <input type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <SortMenu value={sort} onChange={setSort} />
      </div>

      {/* Only this scrolls; the head and filters above stay put. */}
      <div className={`collection-body scroll-y view-${tab}`}>
        {tab === 'grid' && (
          <ul className="card-grid">
            {list.map((c) => <li key={c.id}><CardTile c={c} found={at.has(c.id)} /></li>)}
            {!list.length && <li className="empty">{noMatch}</li>}
          </ul>
        )}

        {tab === 'binder' && (
          // Remounts on a new filter or order, so the binder reopens at its first page.
          <Binder key={`${cat}-${sort}-${needle}`} list={list} at={at} empty={list.length ? undefined : noMatch} />
        )}

        {tab === 'checklist' && (
          <div className="checklist">
            {packs.map((p) => {
              const rows = list.filter((c) => c.pack === p.id);
              if (!rows.length) return null;
              return (
                <table key={p.id}>
                  <caption>{p.name}</caption>
                  <thead>
                    <tr><th scope="col">Card</th>{p.tiers.map((t) => <th key={t.id} scope="col">{t.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
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
              );
            })}
            {!list.length && <p className="empty">{noMatch}</p>}
          </div>
        )}

        {tab === 'favourites' && (
          <ul className="card-grid">
            {favs.map((c) => <li key={c.id}><CardTile c={c} found={at.has(c.id)} /></li>)}
            {!favs.length && <li className="empty">{s.favourites.length ? noMatch : 'No favourites yet. Open a card and press Favourite to pin it here.'}</li>}
          </ul>
        )}

        {tab === 'slabs' && (
          <ul className="slab-shelf">
            {slabs.map((x) => (
              <li key={x.id}>
                <button className="card-btn" onClick={() => openDetail({ cardId: x.cardId, tier: x.tier })} aria-label={`Open ${cardById.get(x.cardId)?.title} details`}>
                  <Slab slab={x} frame={s.equipped.frame} />
                </button>
              </li>
            ))}
            {!slabs.length && <li className="empty">{s.slabs.length ? noMatch : 'No slabs yet. Open any card you own and press Grade one.'}</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
