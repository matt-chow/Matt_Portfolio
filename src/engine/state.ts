import { cardById, type PackId } from '../content/manifest';
import { firstOpenPulls, packById, parseKey, pickWeighted, rollPack, variantKey, type Pull, type Rng } from './packs';
import { evaluateAchievements } from './achievements';

export type Grade = 8 | 9 | 10 | 'misprint';

export interface Slab {
  id: string;
  cardId: string;
  tier: string;
  grade: Grade;
  at: number;
}

export interface Opening {
  packId: PackId;
  pulls: Pull[];
  first: boolean;
  at: number;
}

export interface State {
  version: 1;
  updatedAt: number;
  stacks: Record<string, number>; // ungraded copies per variant key
  discovered: Record<string, number>; // variant key -> first pulled at
  slabs: Slab[];
  favourites: string[];
  opened: Partial<Record<PackId, number>>;
  viewed: string[]; // card ids opened in the detail view
  flags: Record<string, boolean>;
  achievements: Record<string, number>;
  equipped: { back: string; frame: string };
  settings: { theme?: 'light' | 'dark'; muted: boolean; packSize: number };
  lastOpening?: Opening;
}

export const initialState = (): State => ({
  version: 1,
  updatedAt: 0,
  stacks: {},
  discovered: {},
  slabs: [],
  favourites: [],
  opened: {},
  viewed: [],
  flags: {},
  achievements: {},
  equipped: { back: 'classic', frame: 'none' },
  settings: { muted: false, packSize: 5 },
});

export const GRADE_ODDS: { grade: Grade; weight: number }[] = [
  { grade: 8, weight: 250 },
  { grade: 9, weight: 450 },
  { grade: 10, weight: 299 },
  { grade: 'misprint', weight: 1 },
];

const stamp = (s: State, now = Date.now()): State => evaluateAchievements({ ...s, updatedAt: now });

export function openPack(s: State, packId: PackId, rng: Rng, now = Date.now()) {
  const pack = packById.get(packId)!;
  const first = !s.opened[packId];
  const pulls = first ? firstOpenPulls(pack, s.settings.packSize, rng) : rollPack(pack, s.settings.packSize, rng);
  const stacks = { ...s.stacks };
  const discovered = { ...s.discovered };
  const isNew = pulls.map(({ cardId, tier }) => {
    const key = variantKey(cardId, tier);
    stacks[key] = (stacks[key] ?? 0) + 1;
    if (discovered[key]) return false;
    discovered[key] = now;
    return true;
  });
  const lastOpening: Opening = { packId, pulls, first, at: now };
  const state = stamp({ ...s, stacks, discovered, opened: { ...s.opened, [packId]: (s.opened[packId] ?? 0) + 1 }, lastOpening }, now);
  return { state, pulls, isNew, first };
}

/** Consumes one ungraded copy and fixes the grade in the same state transition. */
export function gradeOne(s: State, key: string, rng: Rng, id: string, now = Date.now()) {
  if (!s.stacks[key]) throw new Error(`No ungraded copy of ${key}`);
  const { cardId, tier } = parseKey(key);
  const slab: Slab = { id, cardId, tier, grade: pickWeighted(GRADE_ODDS, rng).grade, at: now };
  const stacks = { ...s.stacks, [key]: s.stacks[key] - 1 };
  if (!stacks[key]) delete stacks[key];
  return { state: stamp({ ...s, stacks, slabs: [...s.slabs, slab] }, now), slab };
}

export const toggleFavourite = (s: State, cardId: string) =>
  stamp({ ...s, favourites: s.favourites.includes(cardId) ? s.favourites.filter((f) => f !== cardId) : [...s.favourites, cardId] });

export const markViewed = (s: State, cardId: string) =>
  s.viewed.includes(cardId) ? s : stamp({ ...s, viewed: [...s.viewed, cardId] });

export const setFlag = (s: State, flag: string) => (s.flags[flag] ? s : stamp({ ...s, flags: { ...s.flags, [flag]: true } }));

export const updateSettings = (s: State, patch: Partial<State['settings']>) => ({ ...s, settings: { ...s.settings, ...patch }, updatedAt: Date.now() });

export const equip = (s: State, patch: Partial<State['equipped']>) => ({ ...s, equipped: { ...s.equipped, ...patch }, updatedAt: Date.now() });

// --- Persistence: versioned plain JSON so a future cloud sync can store the same document. ---

export const STORAGE_KEY = 'collectors-archive:v1';
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const validKey = (k: string) => {
  const { cardId, tier } = parseKey(k);
  const card = cardById.get(cardId);
  return !!card && !!packById.get(card.pack)?.tiers.some((t) => t.id === tier);
};

/** Validates untrusted JSON (localStorage or an imported file) into a State; throws on garbage. */
export function parseState(raw: unknown): State {
  if (!isObj(raw) || raw.version !== 1) throw new Error('Not a portfolio save file (version 1).');
  const base = initialState();
  const counts = (v: unknown) =>
    Object.fromEntries(Object.entries(isObj(v) ? v : {}).filter(([k, n]) => validKey(k) && Number.isInteger(n) && (n as number) > 0)) as Record<string, number>;
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && cardById.has(x)) : []);
  const grades: unknown[] = [8, 9, 10, 'misprint'];
  const slabs = (Array.isArray(raw.slabs) ? raw.slabs : []).filter(
    (x): x is Slab => isObj(x) && typeof x.id === 'string' && typeof x.cardId === 'string' && typeof x.tier === 'string' && validKey(variantKey(x.cardId, x.tier)) && grades.includes(x.grade),
  );
  const settings = isObj(raw.settings) ? raw.settings : {};
  const equipped = isObj(raw.equipped) ? raw.equipped : {};
  const lo = raw.lastOpening;
  return {
    ...base,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
    stacks: counts(raw.stacks),
    discovered: counts(raw.discovered),
    slabs,
    favourites: strings(raw.favourites),
    viewed: strings(raw.viewed),
    opened: Object.fromEntries(Object.entries(isObj(raw.opened) ? raw.opened : {}).filter(([k, n]) => packById.has(k as PackId) && Number.isInteger(n))),
    flags: Object.fromEntries(Object.entries(isObj(raw.flags) ? raw.flags : {}).filter(([, v]) => v === true)) as Record<string, boolean>,
    achievements: Object.fromEntries(Object.entries(isObj(raw.achievements) ? raw.achievements : {}).filter(([, v]) => typeof v === 'number')) as Record<string, number>,
    equipped: { back: typeof equipped.back === 'string' ? equipped.back : base.equipped.back, frame: typeof equipped.frame === 'string' ? equipped.frame : base.equipped.frame },
    settings: {
      theme: settings.theme === 'dark' || settings.theme === 'light' ? settings.theme : undefined,
      muted: settings.muted === true,
      packSize: [3, 5, 7, 10].includes(settings.packSize as number) ? (settings.packSize as number) : 5,
    },
    lastOpening: isObj(lo) && packById.has(lo.packId as PackId) && Array.isArray(lo.pulls) && lo.pulls.every((p) => isObj(p) && validKey(variantKey(String(p.cardId), String(p.tier))))
      ? (lo as unknown as Opening) : undefined,
  };
}

export function loadState(storage: Storage = localStorage): State {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? parseState(JSON.parse(raw)) : initialState();
  } catch {
    return initialState();
  }
}

/** One setItem of the whole document: a refresh sees either the old or the new state, never half. */
export function saveState(s: State, storage: Storage = localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
