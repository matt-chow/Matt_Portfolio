import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
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
});
