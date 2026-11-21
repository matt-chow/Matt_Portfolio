import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cards, profile } from '../src/content/manifest';
import { App, parseRoute } from '../src/ui/App';
import { getState } from '../src/store';

beforeAll(() => {
  // jsdom lacks these browser APIs.
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); };
  window.scrollTo = () => {};
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
