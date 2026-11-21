import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cards, profile } from '../src/content/manifest';
import { App, parseRoute } from '../src/ui/App';
import { act, getState } from '../src/store';
import { initialState } from '../src/engine/state';
import { packById, variantKey } from '../src/engine/packs';

beforeAll(() => {
  // jsdom lacks these browser APIs.
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); };
  // jsdom hides [popover] but can't show one.
  HTMLElement.prototype.showPopover ??= function (this: HTMLElement) { this.style.display = 'block'; };
  window.scrollTo = () => {};
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(cleanup);

const nav = (hash: string) =>
  rtlAct(() => {
    location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

describe('routing', () => {
  it('parses hash routes', () => {
    expect(parseRoute('')).toMatchObject({ page: '', arg: undefined });
    expect(parseRoute('#/open/skills?quick')).toMatchObject({ page: 'open', arg: 'skills' });
    expect(parseRoute('#/open/skills?quick').query.has('quick')).toBe(true);
    expect(parseRoute('#/collection/binder?pack=starter').query.get('pack')).toBe('starter');
  });

  it('home links to every pack and the résumé without opening anything', () => {
    nav('#/');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: profile.name })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /Résumé/ })[0].getAttribute('href')).toBe(profile.resume);
    for (const p of ['Starter', 'Experience', 'Highlights', 'Skills', 'Prototype', 'Personal'])
      expect(screen.getByRole('link', { name: new RegExp(`^${p} pack`) })).toBeTruthy();
  });

  it('the icon-only links keep accessible names and tooltips', () => {
    nav('#/');
    render(<App />);
    const links = screen.getByRole('navigation', { name: 'Links' });
    const want: [RegExp, string][] = [[/Résumé/, profile.resume], [/^Email$/, `mailto:${profile.email}`], [/^GitHub$/, profile.github], [/^Index/, '#/index']];
    for (const [name, href] of want) {
      const a = [...links.querySelectorAll('a')].find((x) => name.test(x.getAttribute('aria-label')!))!;
      expect(a.getAttribute('href')).toBe(href);
      expect(a.dataset.tip).toBeTruthy();
      expect(a.textContent).toBe(''); // icon only
    }
    expect(screen.getByRole('navigation', { name: 'Main' }).querySelector('a[href="#/index"]')!.getAttribute('aria-label')).toMatch(/^Index/);
  });

  it('the pack picker lists all six packs and selecting one marks it, from the chip or the keyboard', () => {
    nav('#/');
    render(<App />);
    const chips = [...screen.getByRole('group', { name: 'Choose a pack' }).querySelectorAll('button')];
    expect(chips.map((c) => c.textContent)).toEqual(['Starter', 'Experience', 'Highlights', 'Skills', 'Prototype', 'Personal']);
    fireEvent.click(chips[3]);
    expect(chips[3].getAttribute('aria-pressed')).toBe('true');
    expect(chips[0].getAttribute('aria-pressed')).toBe('false');
    chips[5].focus();
    fireEvent.keyDown(chips[5], { key: 'ArrowRight' }); // wraps to the first pack
    expect(document.activeElement).toBe(chips[0]);
    expect(chips[0].getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Previous pack' }));
    expect(chips[5].getAttribute('aria-pressed')).toBe('true');
  });

  it('index scrolls as a document; every other route is a fixed-viewport app', () => {
    nav('#/index');
    render(<App />);
    expect(document.documentElement.dataset.layout).toBe('doc');
    for (const hash of ['#/', '#/collection', '#/medals', '#/open/starter']) {
      nav(hash);
      expect(document.documentElement.dataset.layout).toBe('app');
    }
  });

  it('index shows every card with an empty collection (nothing gated)', () => {
    expect(Object.keys(getState().discovered)).toHaveLength(0);
    nav('#/index');
    render(<App />);
    for (const c of cards) expect(screen.getAllByText(c.title).length).toBeGreaterThan(0);
  });

  it('quick-opening Starter fills the binder with all seven cards plus 1–2 premium pulls', () => {
    nav('#/open/starter');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Quick open' }));
    expect(screen.getAllByRole('button', { name: /Open details/ }).length).toBeGreaterThanOrEqual(8);
    expect(getState().opened.starter).toBe(1);
    expect(JSON.parse(localStorage.getItem('collectors-archive:v1')!).opened.starter).toBe(1);
  });

  it('tear animation is skippable, and cards step reveal → next → summary', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    nav('#/open/skills');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Tear open' }));
    const pulls = getState().lastOpening!.pulls.length; // saved before any animation
    expect(getState().opened.skills).toBe(1);
    fireEvent.click(document.querySelector('.stage.tearing')!); // tap to skip the tear
    fireEvent.click(screen.getByRole('button', { name: `Reveal card 1 of ${pulls}` }));
    // A high-rarity pull pauses for suspense first; flush it.
    rtlAct(() => void vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole('button', { name: 'Next card' }));
    expect(screen.getByRole('button', { name: `Reveal card 2 of ${pulls}` })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Skip to all cards' }));
    expect(screen.getAllByRole('button', { name: /Open details/ })).toHaveLength(pulls);
    vi.useRealTimers();
  });
});

describe('drag to tear (flat fallback, as jsdom has no WebGL)', () => {
  const frames = (ms: number) => rtlAct(() => new Promise((r) => setTimeout(r, ms)));
  const slider = () => {
    const el = screen.getByRole('slider');
    el.getBoundingClientRect = () => ({ left: 100, top: 100, width: 200, height: 328, right: 300, bottom: 428, x: 100, y: 100, toJSON() {} });
    el.setPointerCapture = () => {};
    return el;
  };
  const drag = (el: HTMLElement, path: [number, number][]) => {
    fireEvent.pointerDown(el, { pointerId: 1, clientX: path[0][0], clientY: path[0][1], button: 0 });
    for (const [x, y] of path.slice(1)) fireEvent.pointerMove(el, { pointerId: 1, clientX: x, clientY: y });
    fireEvent.pointerUp(el, { pointerId: 1, clientX: path.at(-1)![0], clientY: path.at(-1)![1] });
  };

  it('ignores taps, body drags and vertical swipes; a partial tear keeps its progress without opening', async () => {
    nav('#/open/experience');
    render(<App />);
    const el = slider();
    fireEvent.click(el);
    drag(el, [[200, 300], [320, 302]]); // across the body, not the strip
    drag(el, [[200, 115], [204, 180], [206, 260]]); // scrolling past the strip
    await frames(80);
    expect(el.getAttribute('aria-valuenow')).toBe('0');
    drag(el, [[110, 115], [150, 116], [190, 117]]); // ~45% of the seam, then let go
    await frames(200);
    expect(Number(el.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(40);
    expect(getState().opened.experience).toBeUndefined();
  });

  it('tearing right to left past the threshold rolls the pack, then hands over to the reveal', async () => {
    nav('#/open/highlights');
    render(<App />);
    const el = slider();
    drag(el, [[290, 110], [250, 112], [200, 114], [150, 113], [120, 115]]);
    await frames(300);
    expect(getState().opened.highlights).toBe(1);
    expect(document.querySelector('.stage.tearing')).toBeTruthy();
    await frames(1900);
    expect(screen.getByRole('button', { name: /Reveal card 1 of/ })).toBeTruthy();
  });

  it('arrow keys tear it open too', async () => {
    nav('#/open/prototype');
    render(<App />);
    const el = slider();
    for (let i = 0; i < 6; i++) fireEvent.keyDown(el, { key: 'ArrowLeft' });
    await frames(150);
    expect(getState().opened.prototype).toBe(1);
  });
});

describe('collection', () => {
  const tiles = () => screen.getAllByRole('button', { name: /Open details$/ });

  it('shows every card, found or not, featured work first, with no JSON import/export', () => {
    nav('#/collection');
    render(<App />);
    expect(tiles()).toHaveLength(cards.length);
    expect(tiles()[0].getAttribute('aria-label')).toMatch(/^Infrastructure Canada/);
    expect(screen.queryByText(/Export JSON|Import JSON/)).toBeNull();
    expect(document.querySelector('input[type=file]')).toBeNull();
  });

  it('views are icon-only links with names, tooltips and a current state', () => {
    nav('#/collection/binder');
    render(<App />);
    const links = [...screen.getByRole('navigation', { name: 'Collection views' }).querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('aria-label'))).toEqual(['Grid', 'Binder', 'Checklist', 'Favourites', 'Slabs']);
    for (const a of links) expect(a.dataset.tip).toBe(a.getAttribute('aria-label'));
    expect(links[1].getAttribute('aria-current')).toBe('page');
  });

  it('category chips and search narrow the grid together', () => {
    nav('#/collection');
    render(<App />);
    const chips = [...screen.getByRole('group', { name: 'Category' }).querySelectorAll('button')];
    expect(chips.map((c) => c.textContent)).toEqual(['All', 'Experience', 'Projects', 'Research', 'Skills', 'Other']);
    fireEvent.click(chips[3]);
    expect(chips[3].getAttribute('aria-pressed')).toBe('true');
    expect(tiles().map((t) => t.getAttribute('aria-label')!.split(',')[0].split('.')[0])).toEqual(['Peaks and primes', 'CASSIS 2024 poster', 'CMSAC 2025 poster']);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search cards' }), { target: { value: 'volleyball' } });
    expect(tiles()).toHaveLength(1); // CMSAC; rvolleydata matches too but is a project
    fireEvent.click(chips[0]);
    expect(tiles().length).toBeGreaterThan(1);
  });

  it('sorts A–Z on request', () => {
    nav('#/collection');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Sort by: Featured' }));
    fireEvent.click(screen.getByRole('option', { name: 'A–Z' }));
    expect(screen.queryByRole('listbox')).toBeNull();
    const names = tiles().map((t) => t.getAttribute('aria-label')!.replace(/(, [^,]*)*\. Open details$/, ''));
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('the sort menu works from the keyboard and hands focus back to its button', () => {
    nav('#/collection');
    render(<App />);
    const btn = screen.getByRole('button', { name: 'Sort by: Featured' });
    fireEvent.keyDown(btn, { key: 'ArrowDown' });
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('option', { name: 'Featured', selected: true }));
    const list = screen.getByRole('listbox', { name: 'Sort by' });
    fireEvent.keyDown(list, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(btn);
    fireEvent.keyDown(btn, { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Sort by: Recently found' }));
  });

  it('the view capsule tracks the current view', () => {
    for (const [i, v] of ['grid', 'binder', 'checklist', 'favourites', 'slabs'].entries()) {
      nav(`#/collection/${v}`);
      const { unmount } = render(<App />);
      expect((document.querySelector('.view-switch') as HTMLElement).style.getPropertyValue('--i')).toBe(String(i));
      expect(screen.getByRole('link', { name: ['Grid', 'Binder', 'Checklist', 'Favourites', 'Slabs'][i] }).getAttribute('aria-current')).toBe('page');
      unmount();
    }
  });

  it('a card opens its details', () => {
    nav('#/collection');
    render(<App />);
    fireEvent.click(tiles()[0]);
    expect(screen.getByRole('heading', { level: 2, name: 'Infrastructure Canada' })).toBeTruthy();
  });
});

describe('binder', () => {
  it('turns through double-sided sheets, keeps empty pockets, and opens locked cards', () => {
    act(() => initialState());
    nav('#/collection/binder');
    render(<App />);
    const n = Math.ceil(cards.length / 9);
    const where = () => document.querySelector('.binder-where')!.textContent;
    const prev = screen.getByRole('button', { name: 'Previous page' }) as HTMLButtonElement;
    expect(where()).toContain(`Page 1 of ${n}, sheet 1 front`);
    expect(prev.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(where()).toContain(`Page 2 of ${n}, sheet 1 back`);
    expect(screen.getByRole('list', { name: `Page 2 of ${n}, sheet 1 back` })).toBeTruthy();
    fireEvent.keyDown(document.querySelector('.book')!, { key: 'ArrowLeft' });
    expect(where()).toContain('Page 1 of');

    // the last page keeps its unused pockets as blanks
    for (let i = 1; i < n; i++) fireEvent.keyDown(document.querySelector('.book')!, { key: 'ArrowRight' });
    expect(where()).toContain(`Page ${n} of ${n}`);
    expect((screen.getByRole('button', { name: 'Next page' }) as HTMLButtonElement).disabled).toBe(true);
    const pockets = document.querySelectorAll('.page-r .pocket');
    expect(pockets).toHaveLength(9);
    expect(document.querySelectorAll('.page-r .pocket-empty')).toHaveLength(9 * n - cards.length);

    // an uncollected card in a pocket still opens its details
    fireEvent.click(document.querySelector('.page-r .card-btn')!);
    expect(document.querySelector('dialog.detail[open]')).toBeTruthy();
  });

  it('a new search reopens the binder at its first page', () => {
    nav('#/collection/binder');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'a' } }); // still several pages
    expect(document.querySelector('.binder-where')!.textContent).toMatch(/^1 of [2-9]/);
  });
});

describe('locked cards and finish previews', () => {
  const finishes = () => screen.getAllByRole('radio');

  it('an empty binder shows a named blank for every card and no art', () => {
    act(() => initialState());
    nav('#/collection');
    render(<App />);
    expect(document.querySelectorAll('.card-slot')).toHaveLength(cards.length);
    expect(document.querySelector('.collection-body .card')).toBeNull();
    expect(screen.getByText('Infrastructure Canada', { selector: '.card-slot span' })).toBeTruthy();
  });

  it('an uncollected card stays fully readable, previews every finish locked, and offers no grading or favourite', () => {
    act(() => initialState());
    nav('#/collection');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Infrastructure Canada, not collected yet/ }));
    const card = cards.find((c) => c.title === 'Infrastructure Canada')!;
    expect(screen.getByText(card.summary, { selector: '.detail-text p' })).toBeTruthy();
    for (const d of card.details ?? []) expect(screen.getByText(d)).toBeTruthy();
    expect(document.querySelector('.detail-text .locked, .detail-text .lock-badge')).toBeNull(); // lock is on the card only
    expect(document.querySelector('.detail-visual .locked .lock-badge')).toBeTruthy();
    expect(finishes().map((r) => r.closest('label')!.dataset.tip)).toEqual(['Common', 'Uncommon', 'Rare', 'Illustration Rare', 'Special Illustration Rare']);
    expect(screen.getByRole('radio', { name: 'Rare, not collected' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Grade one|Favourite/ })).toBeNull();
    const before = JSON.stringify({ ...getState(), viewed: [] });
    for (const r of finishes()) fireEvent.click(r); // previews are read-only
    expect(JSON.stringify({ ...getState(), viewed: [] })).toBe(before);
  });

  it('a collected card shows its art; its missing finishes still preview locked', () => {
    act(() => initialState());
    nav('#/open/starter');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Quick open' }));
    cleanup();
    nav('#/collection');
    render(<App />);
    // Every Starter card is pulled in its base finish; at most two get a premium one, so pick a card still missing one.
    const { discovered } = getState();
    const tiers = packById.get('starter')!.tiers;
    const c = cards.find((x) => x.pack === 'starter' && tiers.some((t) => !discovered[variantKey(x.id, t.id)]))!;
    const tile = screen.getByRole('button', { name: new RegExp(`^${c.title}(, \\d+ copies)?\\. Open details$`) });
    expect(tile.querySelector('.card')).toBeTruthy();
    fireEvent.click(tile);
    expect(screen.getByRole('button', { name: /Grade one/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Favourite/ })).toBeTruthy();
    expect(document.querySelector('.detail-visual .locked')).toBeNull();
    const missing = tiers.find((t) => !discovered[variantKey(c.id, t.id)])!;
    fireEvent.click(screen.getByRole('radio', { name: `${missing.label}, not collected` }));
    expect(document.querySelector('.detail-visual .locked')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Grade one/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Favourite/ })).toBeNull(); // only offered on a finish you own
  });
});
