import { cards, type PackId } from '../content/manifest';

export type Rng = () => number;

export interface Tier {
  id: string;
  label: string;
  weight: number;
}

export interface PackDef {
  id: PackId;
  name: string;
  tagline: string;
  series: string;
  tiers: Tier[]; // ascending rarity
  guaranteeFrom: number; // every repeat pack has at least one pull at this tier index or higher
  core: boolean; // fixed core set: the first opening reveals every card
  premiumFrom: number; // first-open bonus pulls come from this tier index or higher
  artFrom?: number; // tiers at this index or higher show the illustration in public/art/<card id>.webp
}

export interface Pull {
  cardId: string;
  tier: string;
}

const t = (id: string, label: string, weight: number): Tier => ({ id, label, weight });

export const packs: PackDef[] = [
  {
    id: 'starter', name: 'Starter', series: 'Series 0', tagline: 'Start here: school, links and contact.',
    tiers: [t('ink', 'Ink Sketch', 60), t('outline', 'Accent Outline', 30), t('accent', 'Full Accent', 10)], guaranteeFrom: 1, core: true, premiumFrom: 2,
  },
  {
    id: 'experience', name: 'Experience', series: 'Series 1', tagline: 'Roles, teams and what got built.',
    tiers: [t('common', 'Common', 50), t('uncommon', 'Uncommon', 26), t('rare', 'Rare', 14), t('ir', 'Illustration Rare', 7), t('sir', 'Special Illustration Rare', 3)],
    guaranteeFrom: 2, core: true, premiumFrom: 3, artFrom: 3,
  },
  {
    id: 'highlights', name: 'Highlights', series: 'Series 2', tagline: 'Packages, papers, posters and podiums.',
    tiers: [t('bronze', 'Bronze', 45), t('silver', 'Silver', 28), t('gold', 'Gold', 16), t('diamond', 'Diamond', 8), t('black', 'Black Diamond', 3)],
    guaranteeFrom: 2, core: true, premiumFrom: 3, artFrom: 3,
  },
  {
    id: 'skills', name: 'Skills', series: 'Tokens', tagline: 'Enamel tokens for every tool, each with receipts.',
    tiers: [t('base', 'Base', 65), t('enhanced', 'Enhanced', 25), t('mastery', 'Mastery', 10)], guaranteeFrom: 1, core: true, premiumFrom: 2,
  },
  {
    id: 'prototype', name: 'Prototype', series: 'Series α', tagline: 'Unfinished experiments, straight off the bench.',
    tiers: [t('alpha', 'Alpha Print', 60), t('sketch', 'Concept Sketch', 30), t('blueprint', 'Blueprint', 10)], guaranteeFrom: 1, core: true, premiumFrom: 2,
  },
  {
    id: 'personal', name: 'Personal', series: 'Scrapbook', tagline: 'Interests and fun facts.',
    tiers: [t('standard', 'Standard', 55), t('illustrated', 'Illustrated', 30), t('holo', 'Holo', 12), t('secret', 'Secret', 3)], guaranteeFrom: 1, core: false, premiumFrom: 2, artFrom: 1,
  },
];

export const packById = new Map(packs.map((p) => [p.id, p]));
export const cardsInPack = (pack: PackId) => cards.filter((c) => c.pack === pack);
export const variantKey = (cardId: string, tier: string) => `${cardId}|${tier}`;
export const parseKey = (key: string) => {
  const [cardId, tier] = key.split('|');
  return { cardId, tier };
};
export const tierIndex = (pack: PackDef, tier: string) => pack.tiers.findIndex((x) => x.id === tier);
/** Illustration for this card at this tier, if its pack has premium art and the tier reaches it. */
export const illustration = (pack: PackDef, cardId: string, tier: string) =>
  pack.artFrom !== undefined && tierIndex(pack, tier) >= pack.artFrom ? `art/${cardId}.webp` : undefined;
export const PACK_SIZES = [3, 5, 7, 10];

export function pickWeighted<T extends { weight: number }>(items: T[], rng: Rng): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    if ((r -= item.weight) < 0) return item;
  }
  return items[items.length - 1];
}

/**
 * First opening of a core pack: every card once at the base finish (manifest order),
 * then 1–2 distinct premium pulls from the same set, revealed last.
 * Packs without a fixed core (Personal) just roll a normal pack.
 */
export function firstOpenPulls(pack: PackDef, size: number, rng: Rng): Pull[] {
  if (!pack.core) return rollPack(pack, size, rng);
  const pool = cardsInPack(pack.id);
  const base = pool.map((c) => ({ cardId: c.id, tier: pack.tiers[0].id }));
  const left = [...pool];
  const premium = Array.from({ length: rng() < 0.5 ? 1 : 2 }, () => ({
    cardId: left.splice(Math.floor(rng() * left.length), 1)[0].id,
    tier: pickWeighted(pack.tiers.slice(pack.premiumFrom), rng).id,
  }));
  return [...base, ...premium.sort((a, b) => tierIndex(pack, a.tier) - tierIndex(pack, b.tier))];
}

/** Repeat opening: independent weighted slots, then the middle-tier guarantee. */
export function rollPack(pack: PackDef, size: number, rng: Rng): Pull[] {
  const pool = cardsInPack(pack.id);
  const pulls = Array.from({ length: size }, () => ({
    cardId: pool[Math.floor(rng() * pool.length)].id,
    tier: pickWeighted(pack.tiers, rng).id,
  }));
  if (!pulls.some((p) => tierIndex(pack, p.tier) >= pack.guaranteeFrom)) {
    pulls[size - 1].tier = pickWeighted(pack.tiers.slice(pack.guaranteeFrom), rng).id;
  }
  // Reveal order: rarest last for suspense.
  return pulls.sort((a, b) => tierIndex(pack, a.tier) - tierIndex(pack, b.tier));
}
