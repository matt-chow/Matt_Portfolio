import { describe, expect, it } from 'vitest';
import { cards } from '../src/content/manifest';
import { cardsInPack, illustration, PACK_SIZE, packById, packs, pickWeighted, rollPack, tierIndex, variantKey } from '../src/engine/packs';
import { GRADE_ODDS, gradeOne, initialState, loadState, openPack, parseState, saveState, STORAGE_KEY, type State } from '../src/engine/state';

// mulberry32: deterministic rng for statistical tests
const seeded = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const memoryStorage = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), clear: () => m.clear(), key: () => null, length: 0 } as Storage;
};

describe('content manifest', () => {
  it('has unique ids, every pack populated, the six required starter cards', () => {
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
    for (const p of packs) expect(cardsInPack(p.id).length).toBeGreaterThan(0);
    expect(cardsInPack('starter').map((c) => c.id)).toEqual(['profile', 'uwaterloo', 'github', 'linkedin', 'email', 'resume', 'devpost']);
    for (const c of cards) expect(c.source.length).toBeGreaterThan(0);
  });

  const shipped = new Set(Object.keys(import.meta.glob('../public/art/*.webp')).map((k) => k.replace('../public/', '')));
  const existsSync = (path: string) => shipped.has(path.replace('public/', ''));

  it('every illustrated tier has its artwork shipped, and packs with key art have a wrapper image', () => {
    for (const c of cards) {
      const p = packById.get(c.pack)!;
      for (const t of p.tiers) {
        const src = illustration(p, c.id, t.id);
        if (src) expect(existsSync(`public/${src}`), src).toBe(true);
      }
    }
    expect(shipped.size).toBeGreaterThan(30);
    for (const p of packs.filter((x) => x.id !== 'starter')) expect(existsSync(`public/art/pack-${p.id}.webp`)).toBe(true);
  });

  it('pack odds sum to 100%', () => {
    for (const p of packs) expect(p.tiers.reduce((s, t) => s + t.weight, 0)).toBe(100);
    expect(GRADE_ODDS.reduce((s, g) => s + g.weight, 0)).toBe(1000);
  });
});

describe('weighted odds', () => {
  it('pickWeighted matches configured probabilities', () => {
    const rng = seeded(1);
    const pack = packById.get('experience')!;
    const n = 200_000;
    const counts: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const id = pickWeighted(pack.tiers, rng).id;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    for (const t of pack.tiers) expect(Math.abs(counts[t.id] / n - t.weight / 100)).toBeLessThan(0.005);
  });

  it('grade odds hold, including the 0.1% misprint', () => {
    const rng = seeded(7);
    const n = 400_000;
    const counts = new Map<unknown, number>();
    for (let i = 0; i < n; i++) {
      const g = pickWeighted(GRADE_ODDS, rng).grade;
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    for (const g of GRADE_ODDS) expect(Math.abs((counts.get(g.grade) ?? 0) / n - g.weight / 1000)).toBeLessThan(0.004);
    expect(counts.get('misprint')).toBeGreaterThan(0);
  });
});

describe('opening packs', () => {
  it('first opening of a core pack reveals every card at base, then 1–2 distinct premium pulls last', () => {
    const premiumCounts = new Set<number>();
    for (const p of packs.filter((x) => x.core)) {
      const ids = cardsInPack(p.id).map((c) => c.id);
      for (let seed = 0; seed < 200; seed++) {
        const { state, pulls, first, isNew } = openPack(initialState(), p.id, seeded(seed));
        expect(first).toBe(true);
        const base = pulls.slice(0, ids.length);
        const premium = pulls.slice(ids.length);
        expect(base).toEqual(ids.map((cardId) => ({ cardId, tier: p.tiers[0].id })));
        expect(premium.length).toBeGreaterThanOrEqual(1);
        expect(premium.length).toBeLessThanOrEqual(2);
        premiumCounts.add(premium.length);
        expect(new Set(premium.map((x) => x.cardId)).size).toBe(premium.length);
        for (const x of premium) {
          expect(ids).toContain(x.cardId);
          expect(tierIndex(p, x.tier)).toBeGreaterThanOrEqual(p.premiumFrom);
        }
        expect(isNew.every(Boolean)).toBe(true);
        expect(Object.keys(state.discovered)).toHaveLength(pulls.length);
      }
    }
    expect([...premiumCounts].sort()).toEqual([1, 2]);
  });

  it('packs without a fixed core open randomly from the start, with the guarantee', () => {
    const p = packById.get('personal')!;
    expect(p.core).toBe(false);
    const rolls = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const { pulls, first } = openPack(initialState(), 'personal', seeded(seed));
      expect(first).toBe(true);
      expect(pulls).toHaveLength(PACK_SIZE);
      expect(pulls.some((x) => tierIndex(p, x.tier) >= p.guaranteeFrom)).toBe(true);
      rolls.add(JSON.stringify(pulls));
    }
    expect(rolls.size).toBeGreaterThan(40);
  });

  it('repeat openings are independent: tier frequencies match the weights outside the guarantee', () => {
    const p = packById.get('experience')!;
    const rng = seeded(21);
    const counts: Record<string, number> = {};
    let n = 0;
    for (let i = 0; i < 20_000; i++) {
      // Size 10: the guarantee redraw is rare enough not to skew common/uncommon shares much.
      for (const x of rollPack(p, 10, rng)) { counts[x.tier] = (counts[x.tier] ?? 0) + 1; n++; }
    }
    expect(Math.abs(counts.common / n - 0.5)).toBeLessThan(0.02);
    expect(Math.abs(counts.sir / n - 0.03)).toBeLessThan(0.01);
  });

  it('every repeat opening has exactly seven cards and a middle-tier-or-better card', () => {
    expect(PACK_SIZE).toBe(7);
    const rng = seeded(3);
    for (const p of packs) {
      let s: State = openPack(initialState(), p.id, rng).state;
      for (let i = 0; i < 300; i++) {
        const r = openPack(s, p.id, rng);
        expect(r.first).toBe(false);
        expect(r.pulls).toHaveLength(7);
        expect(r.pulls.some((x) => tierIndex(p, x.tier) >= p.guaranteeFrom)).toBe(true);
        s = r.state;
      }
    }
  });

  it('rollPack only uses cards and tiers from its own pack', () => {
    const p = packById.get('highlights')!;
    const ids = new Set(cardsInPack('highlights').map((c) => c.id));
    for (const pull of rollPack(p, 10, seeded(4))) {
      expect(ids.has(pull.cardId)).toBe(true);
      expect(tierIndex(p, pull.tier)).toBeGreaterThanOrEqual(0);
    }
  });

  it('duplicates stack and are not new discoveries', () => {
    let s = openPack(initialState(), 'starter', seeded(5)).state;
    const key = variantKey('github', 'ink');
    expect(s.stacks[key]).toBe(1);
    // Force a duplicate by opening repeatedly until github|ink appears again.
    const rng = seeded(6);
    for (let i = 0; i < 200 && s.stacks[key] === 1; i++) {
      const r = openPack(s, 'starter', rng);
      r.pulls.forEach((p, j) => {
        if (s.discovered[variantKey(p.cardId, p.tier)]) expect(r.isNew[j]).toBe(false);
      });
      s = r.state;
    }
    expect(s.stacks[key]).toBeGreaterThan(1);
    const before = s.discovered[key];
    expect(before).toBeDefined();
  });
});

describe('grading', () => {
  const opened = () => openPack(initialState(), 'skills', seeded(8)).state;

  it('consumes exactly one ungraded copy and records a permanent slab', () => {
    const s = opened();
    const key = variantKey('skill-r', 'base');
    const { state, slab } = gradeOne(s, key, seeded(9), 'slab-1', 123);
    expect(s.stacks[key]).toBe(1);
    expect(state.stacks[key]).toBeUndefined();
    expect(state.slabs).toEqual([slab]);
    expect(slab).toMatchObject({ id: 'slab-1', cardId: 'skill-r', tier: 'base', at: 123 });
    expect([8, 9, 10, 'misprint']).toContain(slab.grade);
    expect(state.achievements['first-slab']).toBeDefined();
  });

  it('refuses to grade without an ungraded copy and never mutates input', () => {
    const s = opened();
    const snapshot = JSON.stringify(s);
    expect(() => gradeOne(s, variantKey('skill-r', 'mastery'), seeded(1), 'x')).toThrow();
    gradeOne(s, variantKey('skill-r', 'base'), seeded(1), 'y');
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('grade survives a save/reload round trip (refresh safety)', () => {
    const storage = memoryStorage();
    const { state, slab } = gradeOne(opened(), variantKey('skill-sql', 'base'), seeded(10), 'slab-z');
    saveState(state, storage);
    const reloaded = loadState(storage);
    expect(reloaded.slabs).toEqual([slab]);
    expect(reloaded.stacks[variantKey('skill-sql', 'base')]).toBeUndefined();
  });
});

describe('persistence', () => {
  it('round-trips state through JSON export/import', () => {
    let s = openPack(initialState(), 'experience', seeded(11)).state;
    s = openPack(s, 'experience', seeded(12)).state;
    expect(parseState(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it('rejects foreign files and strips invalid entries', () => {
    expect(() => parseState({ hello: 1 })).toThrow();
    const cleaned = parseState({
      version: 1,
      stacks: { 'github|ink': 2, 'nope|ink': 5, 'github|bogus': 1, 'email|ink': -3, 'resume|ink': 1.5 },
      slabs: [{ id: 'a', cardId: 'github', tier: 'ink', grade: 11, at: 0 }],
      settings: { packSize: 999, theme: 'neon' },
    });
    expect(cleaned.stacks).toEqual({ 'github|ink': 2 });
    expect(cleaned.slabs).toEqual([]);
    expect(cleaned.settings).not.toHaveProperty('packSize'); // retired setting from older saves
    expect(cleaned.settings.theme).toBeUndefined();
  });

  it('falls back to a fresh state on corrupted storage', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, '{not json');
    expect(loadState(storage)).toEqual(initialState());
  });
});

describe('achievements', () => {
  it('unlocks opening and tour achievements, never gating content', () => {
    let s = initialState();
    s = openPack(s, 'starter', seeded(13)).state;
    expect(s.achievements['first-pack']).toBeDefined();
    expect(s.achievements['all-packs']).toBeUndefined();
    for (const p of packs) s = openPack(s, p.id, seeded(14)).state;
    expect(s.achievements['all-packs']).toBeDefined();
    // Every professional card is discovered after one tour; Personal is a random pool (and every card is on the Index page).
    for (const c of cards.filter((x) => x.pack !== 'personal')) expect(Object.keys(s.discovered).some((k) => k.startsWith(`${c.id}|`))).toBe(true);
  });
});
