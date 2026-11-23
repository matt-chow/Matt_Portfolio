import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cardById, indexProfile as ix, profile, type CardContent } from '../content/manifest';
import { useOpenDetail } from './App';
import { Icon } from './Icons';

const pick = (ids: string[]) => ids.map((id) => cardById.get(id)).filter((c): c is CardContent => !!c);
const DEPTH = 'pf-depth';
const saved = () => { try { return localStorage.getItem(DEPTH) === 'full'; } catch { return false; } };
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

/** A recruiter-facing profile curated in `indexProfile`; every entry opens its card, and the binder keeps the rest. */
export function IndexPage() {
  const [full, setFull] = useState(saved);
  // Keep what the reader is looking at in place: note the first entry below the top bar, restore its position after the switch.
  const anchor = useRef<[Element, number]>(undefined);
  const pickDepth = (f: boolean) => {
    const bar = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0;
    const el = [...document.querySelectorAll('.pf-intro, .pf-section h2, .pf-entry')].find((e) => e.getBoundingClientRect().top >= bar);
    anchor.current = el && [el, el.getBoundingClientRect().top];
    setFull(f);
    try { localStorage.setItem(DEPTH, f ? 'full' : 'skim'); } catch { /* private mode: just this visit */ }
  };
  useLayoutEffect(() => {
    const a = anchor.current;
    anchor.current = undefined;
    if (a) window.scrollBy({ top: a[0].getBoundingClientRect().top - a[1], behavior: 'instant' });
  }, [full]);
  const skills = ix.skills.map((g) => ({ ...g, cards: pick(g.ids) })).filter((g) => g.cards.length);
  const research = pick(ix.research);
  const education = pick(ix.education);
  const sections: [string, string, ReactNode][] = [
    ['experience', 'Experience', pick(ix.experience).map((c) => <Entry key={c.id} c={c} full={full} />)],
    ['projects', 'Selected projects', pick(ix.projects).map((c) => <Entry key={c.id} c={c} full={full} />)],
    [
      'research',
      'Research & presentations',
      (research.length || ix.talks.length) && (
        <>
          {research.map((c) => <Entry key={c.id} c={c} full={full} />)}
          {ix.talks.map((t) => <Entry key={t.title} c={{ ...cardById.get(t.card)!, title: t.title, subtitle: t.meta, kicker: 'Presentation', summary: '', details: undefined, tags: undefined, links: undefined }} />)}
        </>
      ),
    ],
    [
      'skills',
      'Technical skills',
      skills.length > 0 && (
        <dl className="pf-skills">
          {skills.map((g) => (
            <div key={g.label}>
              <dt>{g.label}</dt>
              <dd>{g.cards.map((c) => c.title).join(' · ')}</dd>
            </div>
          ))}
        </dl>
      ),
    ],
    [
      'education',
      'Education',
      education.length > 0 && (
        <>
          {education.map((c) => <Entry key={c.id} c={c} brief />)}
          {ix.awards.length > 0 && (
            <div className="pf-entry">
              <p className="pf-when">Awards</p>
              <ul className="pf-awards">{ix.awards.map((a) => <li key={a.title}>{a.title} <span className="muted">· {a.year}</span></li>)}</ul>
            </div>
          )}
        </>
      ),
    ],
    ['leadership', 'Leadership', pick(ix.leadership).map((c) => <Entry key={c.id} c={c} full={full} />)],
  ];
  const shown = sections.filter(([, , body]) => (Array.isArray(body) ? body.length : body));
  const active = useActive(shown.map(([id]) => id));

  return (
    <div className={`page profile${full ? '' : ' pf-skim'}`}>
      <header className="pf-intro pf-in">
        <h1>{profile.name}</h1>
        <p className="pf-role">{cardById.get('profile')?.subtitle}</p>
        <p className="lede">{profile.tagline}</p>
        <p className="muted">{profile.sub}</p>
        <p className="pf-contact">
          <a className="icon-btn primary" href={profile.resume} aria-label="Résumé (PDF)" data-tip="Résumé"><Icon name="resume" /></a>
          <a className="icon-btn" href={profile.github} aria-label="GitHub" data-tip="GitHub"><Icon name="github" /></a>
          <a className="icon-btn" href={profile.linkedin} aria-label="LinkedIn" data-tip="LinkedIn"><Icon name="linkedin" /></a>
          <a className="icon-btn" href={`mailto:${profile.email}`} aria-label={`Email ${profile.email}`} data-tip="Email"><Icon name="email" /></a>
        </p>
      </header>
      {/* The rail stays in view (side column, or a floating switch on narrow screens) so depth can change anywhere. */}
      <div className="pf-rail">
        <nav className="pf-toc pf-in" aria-label="On this page">
          {shown.map(([id, title]) => (
            // Routing lives in the hash, so section links scroll instead of navigating.
            <a key={id} href="#/index" aria-current={active === id ? 'location' : undefined} onClick={(e) => (e.preventDefault(), scrollTo(id))}>{title}</a>
          ))}
        </nav>
        <fieldset className="seg pf-depth">
          <legend className="sr-only">How much detail</legend>
          <label><input type="radio" name="pf-depth" checked={!full} onChange={() => pickDepth(false)} /><span>Skim</span></label>
          <label><input type="radio" name="pf-depth" checked={full} onChange={() => pickDepth(true)} /><span>Full detail</span></label>
        </fieldset>
        </div>
      {shown.map(([id, title, body], i) => (
        <section key={id} id={id} aria-labelledby={`${id}-h`} className="pf-section pf-in" style={{ '--i': i + 1 } as CSSProperties}>
          <h2 id={`${id}-h`}>{title}</h2>
          {body}
        </section>
      ))}
      <footer className="pf-more">
        <p className="muted">Every card, including earlier roles and side projects, lives in the collection.</p>
        <p className="row">
          <a className="btn btn-quiet" href="#/">Open packs</a>
          <a className="btn btn-quiet" href="#/collection">Browse the binder</a>
        </p>
      </footer>
    </div>
  );
}

/** One row: dates on the left, a title that opens the card, then a one-line summary or, when `full`, the bullets and tags; `brief` keeps only the heading lines and links. */
function Entry({ c, brief, full }: { c: CardContent; brief?: boolean; full?: boolean }) {
  const openDetail = useOpenDetail();
  return (
    <article className="pf-entry">
      <p className="pf-when">{c.kicker?.split(' · ').map((k) => <span key={k}>{k}</span>)}</p>
      <div>
        <h3>
          <button className="pf-title" onClick={() => openDetail({ cardId: c.id })} aria-label={`${c.title}${c.subtitle ? `, ${c.subtitle}` : ''}: open card`}>
            {c.title}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </button>
        </h3>
        {c.subtitle && <p className="pf-sub">{c.subtitle}</p>}
        {brief ? null : full && c.details ? <ul>{c.details.map((d) => <li key={d}>{d}</li>)}</ul> : c.summary && <p>{c.summary}</p>}
        {full && c.tags && <p className="pf-tags">{c.tags.join(' · ')}</p>}
        {c.links && <p className="pf-links">{c.links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}</p>}
      </div>
    </article>
  );
}

/** The section nearest the top of the viewport, for the contents' current marker. */
function useActive(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join();
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-20% 0px -70% 0px' });
    key.split(',').forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [key]);
  return active;
}
