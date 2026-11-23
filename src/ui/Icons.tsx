/** One icon set: 24px grid, 1.8 stroke (styled by .icon-btn / .nav-pill svg), matching the header's sound and theme icons. */
const ICONS = {
  resume: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7.5 8.5 6 8.5-6" />
    </>
  ),
  // GitHub's mark is a filled glyph; drawn slightly smaller so it weighs the same as the stroked icons.
  github: (
    <path
      className="fill"
      stroke="none"
      transform="translate(1.5 1.5) scale(0.875)"
      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
    />
  ),
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.3-2.6s2.2.9 2.2 2.6V16" />
    </>
  ),
  index: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  // Collection views and filters
  grid: (
    <>
      <rect x="3" y="4" width="5" height="7" rx="1.2" />
      <rect x="9.5" y="4" width="5" height="7" rx="1.2" />
      <rect x="16" y="4" width="5" height="7" rx="1.2" />
      <rect x="3" y="13" width="5" height="7" rx="1.2" />
      <rect x="9.5" y="13" width="5" height="7" rx="1.2" />
      <rect x="16" y="13" width="5" height="7" rx="1.2" />
    </>
  ),
  binder: (
    <>
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" />
      <path d="M12 6.5v13" />
    </>
  ),
  checklist: <path d="m3.5 6 1.5 1.5 3-3M3.5 12 5 13.5l3-3M3.5 18 5 19.5l3-3M11.5 6.5H20M11.5 12.5H20M11.5 18.5H20" />,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />,
  slab: (
    <>
      <rect x="5.5" y="3.5" width="13" height="17" rx="2" />
      <path d="M5.5 7.5h13" />
      <rect x="8.5" y="10.5" width="7" height="7" rx="1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  sort: <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  chevron: <path d="m7 10 5 5 5-5" />,
  check: <path d="m5.5 12.5 4 4 9-9" />,
  prev: <path d="m14.5 6-6 6 6 6" />,
  next: <path d="m9.5 6 6 6-6 6" />,
};

const STAR = 'm12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z';
const SHAPES = {
  square: <rect x="5.5" y="5.5" width="13" height="13" rx="2.5" />,
  circle: <circle cx="12" cy="12" r="6.5" />,
  diamond: <path d="M12 4 20 12 12 20 4 12Z" />,
  star: <path d={STAR} />,
  stars: <path transform="translate(-2.5 2.5) scale(0.8)" d={STAR} />, // drawn twice, see TierIcon
  gem: (
    <>
      <path d="M7.5 5h9l4 5-8.5 10L3.5 10Z" />
      <path fill="none" strokeOpacity="0.55" d="M3.5 10h17M12 20 9 10l1.5-5M12 20l3-10-1.5-5" />
    </>
  ),
  token: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="4" fill="none" strokeOpacity="0.6" />
    </>
  ),
  triangle: <path d="M12 4.5 20 19H4Z" />,
  heart: <path d="M12 19.5s-7.5-4.4-7.5-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7.5 2.1c0 5-7.5 9.4-7.5 9.4Z" />,
};
/** Rarity symbols, one shape family per pack, rising in colour. Fixed palette like the printed cards;
    dark fills get a light edge so they read on both themes. [shape, fill, stroke, dashed] */
const TIER_LOOK: Record<string, [keyof typeof SHAPES, string, string?, true?]> = {
  ink: ['square', 'none', '#8a90a6'],
  outline: ['square', 'none', '#6366f1'],
  accent: ['square', '#6366f1', '#4f46e5'],
  common: ['circle', '#a3abbe', '#8a92a8'],
  uncommon: ['diamond', '#7c86a3', '#646e8c'],
  rare: ['star', '#4f46e5', '#7b74f0'],
  ir: ['star', '#e0b23a', '#b8912a'],
  sir: ['stars', '#e0b23a', '#b8912a'],
  bronze: ['gem', '#c07a43', '#8f5529'],
  silver: ['gem', '#c3c9d4', '#8d96a8'],
  gold: ['gem', '#e6b93d', '#a98320'],
  diamond: ['gem', '#9ad9f5', '#4fa7cf'],
  black: ['gem', '#24262f', '#9aa0b8'],
  base: ['token', '#a3abbe', '#7f889e'],
  enhanced: ['token', '#5b8cff', '#3f6fe0'],
  mastery: ['token', '#e6b93d', '#a98320'],
  alpha: ['triangle', 'none', '#8a90a6'],
  sketch: ['triangle', 'none', '#6366f1', true],
  blueprint: ['triangle', '#2f6fe4', '#1d55c0'],
  standard: ['heart', 'none', '#8a90a6'],
  illustrated: ['heart', '#f06aa8', '#cc4486'],
  holo: ['heart', '#a78bfa', '#f06aa8'],
  secret: ['heart', '#24262f', '#e6b93d'],
};

export function TierIcon({ tier }: { tier: string }) {
  const [shape, fill, stroke = fill, dashed] = TIER_LOOK[tier] ?? ['circle', 'currentColor'];
  return (
    <svg className="tier-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeDasharray={dashed && '2.4 1.8'}>
      {SHAPES[shape]}
      {shape === 'stars' && <path transform="translate(7 -1) scale(0.7)" d={STAR} />}
    </svg>
  );
}

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  );
}
