import { createContext, useContext, useEffect, useLayoutEffect, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { achievementById } from '../engine/achievements';
import { setFlag, updateSettings } from '../engine/state';
import { act, onAchievements, useStore } from '../store';
import { sfx } from '../sound';
import { Home } from './Home';
import { Opening } from './Opening';
import { Collection } from './Collection';
import { Medals } from './Medals';
import { IndexPage } from './IndexPage';
import { CardDetail } from './CardDetail';
import type { PackId } from '../content/manifest';

export function parseRoute(hash: string) {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const [page = '', arg] = path.split('/');
  return { page, arg, query: new URLSearchParams(query) };
}

export const go = (to: string) => {
  location.hash = to;
};

function useRoute() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => {
      setHash(location.hash);
      window.scrollTo({ top: 0 });
      const main = document.getElementById('main');
      if (main) main.scrollTop = 0;
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return parseRoute(hash);
}

type Detail = { cardId: string; tier?: string } | null;
const DetailCtx = createContext<(d: Detail) => void>(() => {});
export const useOpenDetail = () => useContext(DetailCtx);

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function toggleTheme(e: MouseEvent<HTMLButtonElement>) {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  const apply = () => {
    root.dataset.theme = next;
    act((s) => setFlag(updateSettings(s, { theme: next }), 'theme'));
  };
  if (!document.startViewTransition || reduce()) return apply();
  const r = e.currentTarget.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(() => flushSync(apply)).ready.then(() =>
    root.animate(
      { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(.3,.7,.2,1)', pseudoElement: '::view-transition-new(root)' },
    ),
  );
}

function Toasts() {
  const [items, setItems] = useState<{ key: number; id: string }[]>([]);
  useEffect(
    () =>
      onAchievements((ids) => {
        sfx.medal();
        const added = ids.map((id) => ({ key: Math.random(), id }));
        setItems((xs) => [...xs, ...added]);
        setTimeout(() => setItems((xs) => xs.filter((x) => !added.includes(x))), 4200);
      }),
    [],
  );
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map(({ key, id }) => {
          const a = achievementById.get(id)!;
          return (
            <motion.a
              key={key}
              href="#/medals"
              className="toast"
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            >
              <span className={`medal-mini medal-${a.medal}`} aria-hidden="true" />
              <span>
                <strong>Medal unlocked: {a.name}</strong>
                {a.reward && <small>Reward: {a.reward.label}</small>}
              </span>
            </motion.a>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

const NAV = [
  { href: '#/', page: '', label: 'Packs' },
  { href: '#/collection', page: 'collection', label: 'Binder' },
  { href: '#/medals', page: 'medals', label: 'Medals' },
  { href: '#/index', page: 'index', label: 'Index' },
];

export function App() {
  const route = useRoute();
  const s = useStore();
  const [detail, setDetail] = useState<Detail>(null);
  const owned = Object.values(s.stacks).reduce((a, b) => a + b, 0) + s.slabs.length;

  let page;
  if (route.page === 'open' && route.arg) page = <Opening key={route.arg} packId={route.arg as PackId} quick={route.query.has('quick')} />;
  else if (route.page === 'collection') page = <Collection tab={route.arg} pack={route.query.get('pack') ?? undefined} />;
  else if (route.page === 'medals') page = <Medals />;
  else if (route.page === 'index') page = <IndexPage />;
  else page = <Home />;

  // Index reads as a document; every other route is a fixed-viewport app (see .css `data-layout`).
  const layout = route.page === 'index' ? 'doc' : 'app';
  useLayoutEffect(() => {
    document.documentElement.dataset.layout = layout;
  }, [layout]);

  return (
    <DetailCtx.Provider value={setDetail}>
      <a className="skip" href="#main" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())}>
        Skip to content
      </a>
      <header className="topbar">
        <a href="#/" className="brand" aria-label="Matthew Chow, home">
          <span className="brand-stamp" aria-hidden="true"><span>MC</span></span>
          <span className="brand-text">
            <strong>Matthew Chow</strong>
            <small>Data science · Applied AI</small>
          </span>
        </a>
        <nav aria-label="Main" className="quicknav">
          {NAV.map((n) => (
            <a key={n.page} href={n.href} className="nav-pill" aria-current={route.page === n.page ? 'page' : undefined} data-binder-target={n.page === 'collection' || undefined}>
              {n.label}
              {n.page === 'collection' && owned > 0 && <span className="count">{owned}</span>}
            </a>
          ))}
        </nav>
        <div className="controls">
          <button className="icon-btn" onClick={() => act((s) => updateSettings(s, { muted: !s.settings.muted }))} aria-pressed={!s.settings.muted} aria-label={s.settings.muted ? 'Sound off. Turn sound on' : 'Sound on. Turn sound off'}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z" />{s.settings.muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M16 8a5 5 0 0 1 0 8m2.5-10.5a8.5 8.5 0 0 1 0 13" />}</svg>
          </button>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Switch light or dark lighting">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" /><path d="M12 7a5 5 0 0 0 0 10Z" className="fill" /></svg>
          </button>
        </div>
      </header>
      <main id="main" tabIndex={-1}>{page}</main>
      <footer className="foot">
        <p>
          © {new Date().getFullYear()} Matthew Chow. Original artwork, drawn in code or generated for this site. <a href="#/index">Everything on one page</a>.
        </p>
      </footer>
      <Toasts />
      {detail && <CardDetail {...detail} onClose={() => setDetail(null)} />}
    </DetailCtx.Provider>
  );
}
