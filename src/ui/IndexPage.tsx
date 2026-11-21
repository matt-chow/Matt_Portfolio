import { cards, contentTodos, profile, sourceLabel } from '../content/manifest';
import { packs } from '../engine/packs';

/** Every fact on the site as plain, linkable text. Independent of the collection. */
export function IndexPage() {
  return (
    <div className="page index-page">
      <h1>Index</h1>
      <p className="lede">Everything in the archive on one page, no packs required.</p>
      <p className="row">
        <a className="btn" href={profile.resume}>Résumé (PDF)</a>
        <a className="btn btn-quiet" href={`mailto:${profile.email}`}>{profile.email}</a>
        <a className="btn btn-quiet" href={profile.github}>GitHub</a>
        <a className="btn btn-quiet" href={profile.linkedin}>LinkedIn</a>
        <a className="btn btn-quiet" href={profile.devpost}>Devpost</a>
      </p>
      <nav aria-label="Index sections" className="toc">
        {packs.map((p) => <a key={p.id} href={`#/index`} onClick={(e) => (e.preventDefault(), document.getElementById(`ix-${p.id}`)?.scrollIntoView())}>{p.name}</a>)}
      </nav>
      {packs.map((p) => (
        <section key={p.id} id={`ix-${p.id}`} aria-labelledby={`ixh-${p.id}`}>
          <h2 id={`ixh-${p.id}`}>{p.name}</h2>
          <p className="muted">{p.tagline}</p>
          <dl className="ix-list">
            {cards.filter((c) => c.pack === p.id).map((c) => (
              <div key={c.id} className="ix-item">
                <dt>
                  <strong>{c.title}</strong>
                  {c.subtitle && <span> · {c.subtitle}</span>}
                  {c.kicker && <span className="muted"> · {c.kicker}</span>}
                </dt>
                <dd>
                  <p>{c.summary}</p>
                  {c.details && <ul>{c.details.map((d) => <li key={d}>{d}</li>)}</ul>}
                  {c.links && <p className="row">{c.links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}</p>}
                  <p className="small muted">Source: {sourceLabel(c.source)}{c.subset ? ` · ${c.subset}` : ''}</p>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <section aria-labelledby="ix-gaps">
        <h2 id="ix-gaps">Not yet confirmed</h2>
        <p className="muted">Open questions about this site's content. Nothing here is shown elsewhere as fact.</p>
        <ul className="todos">{contentTodos.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>
    </div>
  );
}
