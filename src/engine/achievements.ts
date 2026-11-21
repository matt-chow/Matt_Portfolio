import { cards } from '../content/manifest';
import { cardsInPack, packById, packs, parseKey, tierIndex, variantKey } from './packs';
import type { State } from './state';

export interface Reward {
  kind: 'back' | 'frame' | 'decor';
  id: string;
  label: string;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  medal: 'bronze' | 'silver' | 'gold';
  reward?: Reward;
  test: (s: State) => boolean;
}

const discoveredKeys = (s: State) => Object.keys(s.discovered);
const pulledTier = (s: State, fromTop: number) =>
  discoveredKeys(s).some((k) => {
    const { cardId, tier } = parseKey(k);
    const pack = packById.get(cards.find((c) => c.id === cardId)!.pack)!;
    return tierIndex(pack, tier) >= pack.tiers.length - fromTop;
  });
const owned = (s: State) => Object.values(s.stacks).reduce((a, b) => a + b, 0) + s.slabs.length;

export const achievements: Achievement[] = [
  { id: 'first-pack', name: 'Fresh Wrapper', desc: 'Open your first pack.', medal: 'bronze', reward: { kind: 'back', id: 'kraft', label: 'Kraft card back' }, test: (s) => Object.keys(s.opened).length > 0 },
  { id: 'all-packs', name: 'Grand Tour', desc: 'Open every pack at least once.', medal: 'gold', reward: { kind: 'frame', id: 'brass', label: 'Brass frame' }, test: (s) => packs.every((p) => s.opened[p.id]) },
  { id: 'close-reader', name: 'Close Reader', desc: 'Inspect 10 cards up close.', medal: 'bronze', test: (s) => s.viewed.length >= 10 },
  { id: 'archivist', name: 'Archivist', desc: 'Inspect every card in the archive.', medal: 'gold', reward: { kind: 'back', id: 'blueprint', label: 'Blueprint card back' }, test: (s) => s.viewed.length >= cards.length },
  { id: 'shiny', name: 'Shiny!', desc: 'Pull a card from one of a pack’s top two rarities.', medal: 'silver', reward: { kind: 'decor', id: 'star', label: 'Gold star sticker' }, test: (s) => pulledTier(s, 2) },
  { id: 'chase', name: 'Chase Card', desc: 'Pull a pack’s rarest finish.', medal: 'gold', reward: { kind: 'frame', id: 'holo', label: 'Prismatic frame' }, test: (s) => pulledTier(s, 1) },
  {
    id: 'spectrum', name: 'Full Spectrum', desc: 'Discover every finish of a single card.', medal: 'gold', reward: { kind: 'decor', id: 'comet', label: 'Comet sticker' },
    test: (s) => cards.some((c) => packById.get(c.pack)!.tiers.every((t) => s.discovered[variantKey(c.id, t.id)])),
  },
  {
    id: 'starter-master', name: 'Starter Master Set', desc: 'Discover every finish of every Starter card.', medal: 'gold', reward: { kind: 'back', id: 'gilded', label: 'Gilded card back' },
    test: (s) => cardsInPack('starter').every((c) => packById.get('starter')!.tiers.every((t) => s.discovered[variantKey(c.id, t.id)])),
  },
  { id: 'first-slab', name: 'Into the Slab', desc: 'Grade your first card.', medal: 'bronze', test: (s) => s.slabs.length > 0 },
  { id: 'gem-mint', name: 'Gem Mint', desc: 'Receive a Grade 10.', medal: 'gold', reward: { kind: 'frame', id: 'gem', label: 'Gem Mint frame' }, test: (s) => s.slabs.some((x) => x.grade === 10) },
  { id: 'misprint', name: 'Error Card', desc: 'Receive a one-in-a-thousand misprint.', medal: 'gold', reward: { kind: 'back', id: 'misprint', label: 'Misprint card back' }, test: (s) => s.slabs.some((x) => x.grade === 'misprint') },
  { id: 'shelf', name: 'Display Shelf', desc: 'Own 10 slabs.', medal: 'silver', test: (s) => s.slabs.length >= 10 },
  { id: 'hoarder', name: 'Hoarder', desc: 'Own 100 cards.', medal: 'silver', test: (s) => owned(s) >= 100 },
  { id: 'favourites', name: 'Top Loader', desc: 'Favourite 3 cards.', medal: 'bronze', test: (s) => s.favourites.length >= 3 },
  { id: 'night-shift', name: 'Night Shift', desc: 'Switch the lighting.', medal: 'bronze', test: (s) => !!s.flags.theme },
  { id: 'backup', name: 'Safe Keeping', desc: 'Export your collection.', medal: 'bronze', test: (s) => !!s.flags.exported },
];

export const achievementById = new Map(achievements.map((a) => [a.id, a]));

export function evaluateAchievements(s: State): State {
  const fresh = achievements.filter((a) => !s.achievements[a.id] && a.test(s));
  if (!fresh.length) return s;
  return { ...s, achievements: { ...s.achievements, ...Object.fromEntries(fresh.map((a) => [a.id, s.updatedAt || Date.now()])) } };
}

export const unlockedRewards = (s: State, kind: Reward['kind']) =>
  achievements.filter((a) => s.achievements[a.id] && a.reward?.kind === kind).map((a) => a.reward!);

// Equippable defaults; decor stickers are shown automatically once unlocked.
export const DEFAULT_REWARDS = {
  back: { kind: 'back', id: 'classic', label: 'Classic card back' },
  frame: { kind: 'frame', id: 'none', label: 'No frame' },
} satisfies Record<'back' | 'frame', Reward>;
