# Notes for agents

- Facts come only from `src/content/manifest.ts`. Never invent dates, metrics, roles or achievements; put unknowns in `contentTodos`, and give every card a `source`.
- No confidential employer details. Keep public-sector work at the level of the résumé.
- Medals unlock cosmetics only (backs, frames, stickers). Content must stay readable without opening anything: the home links, the card detail for unseen cards, every slot in the binder, and `#/index` (a curated profile set in `indexProfile`).
- State changes go through the pure functions in `src/engine/state.ts` and `act`/`actWith` in `src/store.ts`. Any roll is saved before its animation plays.
- Don't copy code or assets from GPL-3.0 card-effect repos; the holo effect here is an independent implementation.
- Run `npm run check && npm run build` before committing. Use conventional commits. Never force-push or deploy without the owner's go-ahead.
