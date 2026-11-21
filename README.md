# Matthew Chow · portfolio

A portfolio presented as a trading-card set. Open packs, fill a binder, grade cards into slabs and earn medals. Everything is also readable without playing: the résumé link sits on the homepage, and `#/index` lists every card as plain text.

## Run

```sh
npm ci
npm run dev      # local dev server
npm run check    # typecheck + tests
npm run build    # production build into dist/
```

## How it fits together

| Path | What it holds |
|---|---|
| `src/content/manifest.ts` | The only source of facts. Each card has a `source` (R = résumé, S = old site, G = public GitHub, A = content audit). Unverified items live in `contentTodos`, which appear on the Index page and nowhere else. |
| `src/engine/packs.ts` | Pack definitions, rarity weights, first-open lists and the repeat-pack guarantee. |
| `src/engine/state.ts` | Pure state transitions (open, grade, favourite…), plus versioned JSON persistence and validation. |
| `src/engine/achievements.ts` | Medals and the cosmetic rewards they unlock. |
| `src/store.ts` | Applies a transition and saves it in a single `localStorage.setItem`. |
| `src/ui/` | React views. Card templates live in `Card.tsx`; finishes are CSS in `src/styles/cards.css`. |
| `src/ui/ring3d.ts`, `ringPhysics.ts` | The homepage pack ring: a lazily loaded Three.js scene and the pure spring that drives it (unit-tested). |

- **Refresh safety.** Pack results and grades are saved before any animation plays. A ceremony only reveals what is already stored, so a refresh never rerolls.
- **Sync-ready.** The save is one versioned JSON document (`collectors-archive:v1`), identical to the export file. A future cloud sync can store it as-is.
- **3D and fallbacks.** The pack ring loads Three.js (about 123 KB gzipped) only when WebGL2 is available and reduced motion is off. Otherwise the homepage shows the flat scroller. The canvas is decorative: every action is also a real link or button beside it (chips, "Open", "Quick open", arrow keys), so screen readers and keyboards skip the WebGL. Everything else, including the tear, card stepping, holo and slabs, is DOM and CSS, and under reduced motion it becomes instant.
- **Adding a card.** Add an entry to the manifest with a `source`. Its pack's template, finishes and odds apply automatically.

## Odds

| Pack | Tiers (weight %) | Repeat-pack guarantee |
|---|---|---|
| Starter | Ink Sketch 60 · Accent Outline 30 · Full Accent 10 | Accent Outline or better |
| Experience | Common 50 · Uncommon 26 · Rare 14 · Illustration Rare 7 · Special Illustration Rare 3 | Rare or better |
| Highlights | Bronze 45 · Silver 28 · Gold 16 · Diamond 8 · Black Diamond 3 | Gold or better |
| Skills | Base 65 · Enhanced 25 · Mastery 10 | Enhanced or better |
| Prototype | Alpha Print 60 · Concept Sketch 30 · Blueprint 10 | Concept Sketch or better |
| Personal | Standard 55 · Illustrated 30 · Holo 12 · Secret 3 | Illustrated or better |
| Grading | 8: 25 · 9: 45 · 10: 29.9 · Misprint: 0.1 | — |

- The first opening of a pack with a fixed core set (all but Personal) reveals every card at the base tier, then adds 1–2 premium pulls (50/50) of different cards from the same set: Full Accent, Illustration Rare or better, Diamond or better, Mastery, or Blueprint. These come last.
- Personal has no fixed core, so even its first opening is a normal random pack.
- In later packs, every slot rolls independently. If no slot reaches the guarantee tier, the last slot is redrawn from the tiers at or above it.

## Licensing

- [simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css) and pokemon-cards-151 are GPL-3.0. None of their code, images or masks are used.
- The tilt, holo, glare and glitter layers are an independent implementation: pointer position is written to CSS variables, and the layers are gradients with blend modes. This keeps the site free of GPL obligations.
- The Experience and Highlights layouts borrow genre conventions only (creature-card and vintage baseball-card), with no third-party names, logos or art.
- Base-tier artwork is SVG or CSS drawn in this repo.
- The paintings in `public/art` (premium tiers and pack wrappers) were generated for this site with OpenAI image generation, run through the Codex CLI. They are original scenes with no people, text, logos or third-party characters. One image, `p-games`, was regenerated because the first draft looked too much like a commercial console. Prompts are written to stay generic. Exports are 640px WebP, about 106 KB each and 3.5 MB in total, and they load lazily.
- The project and employer logos in `public/images` were carried over from the previous site. They belong to their owners and are used only to identify those organisations.
- There is no portrait yet: the Starter profile card shows a placeholder until a real photo is supplied.

## Deploy (free: GitHub Pages)

`.github/workflows/deploy.yml` runs the checks and builds on every push to `main`, then publishes `dist/` to Pages.

1. In the repo settings, open **Pages** and set **Source** to **GitHub Actions**.
2. Merge `feat/collectors-archive` into `main` and push.

The build uses hash routing and relative asset paths, so it works at `matt-chow.github.io/Matt_Portfolio/` or any other path.
