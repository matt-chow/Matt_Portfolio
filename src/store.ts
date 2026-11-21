import { useSyncExternalStore } from 'react';
import { loadState, saveState, STORAGE_KEY, type State } from './engine/state';

let state: State = loadState();
const listeners = new Set<() => void>();
const toastListeners = new Set<(ids: string[]) => void>();
const notify = () => listeners.forEach((l) => l());

export const getState = () => state;

/** Applies a pure transition, persists it in one write, then notifies. */
export function act(fn: (s: State) => State) {
  const prev = state;
  const next = fn(prev);
  if (next === prev) return;
  state = next;
  saveState(state);
  const fresh = Object.keys(state.achievements).filter((id) => !prev.achievements[id]);
  if (fresh.length) toastListeners.forEach((l) => l(fresh));
  notify();
}

/** Runs a transition that also returns a result (pulls, slab…). */
export function actWith<R>(fn: (s: State) => { state: State } & R): R {
  let out!: { state: State } & R;
  act((s) => (out = fn(s)).state);
  return out;
}


const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));
export const useStore = () => useSyncExternalStore(subscribe, getState);
export const onAchievements = (l: (ids: string[]) => void) => (toastListeners.add(l), () => void toastListeners.delete(l));

// Another tab changed the collection: adopt its saved state.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      state = loadState();
      notify();
    }
  });
}
