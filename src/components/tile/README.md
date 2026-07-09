# components/tile

Shared tile presentation primitives for Binglebingle. This module owns reusable tile visuals and character display helpers only; context-specific interaction, animation, game-state behavior, and hitbox wrappers stay in the consuming feature modules.

## Exports

- `BaseTile` — visual primitive for a tile-like surface with the shared black face, gradient text, shadow, and decorative 번개문 lightning border. Accepts display content, an optional element kind for semantic rendering, safe DOM hooks for consumers (`ref`, `dataAttributes`, `testId`, `onAnimationEnd`), and narrow visual variant props. It uses `lightning-border.svg` as a CSS mask for its linear-gradient decorative border, but does not resolve game characters, dispatch actions, read context, configure GSAP, or implement drag/drop behavior.
- `BaseTileProps` — props for `BaseTile`; names describe visual concerns rather than pool, submission, or history behavior.
- `BaseTileElement` — supported semantic elements: `"button"`, `"div"`, or `"span"`.
- `CharacterTile` — character-aware wrapper that accepts a game `Character`, resolves it with `resolveCharacter`, and renders `BaseTile` with the resolved text.
- `CharacterTileProps` — props for `CharacterTile`; mirrors the allowed visual props from `BaseTile` plus the `character` value.
- `useTileFeedback` — shared hook for GSAP tile feedback animations (rotate squeeze, compose pulse/particles, entrance scale). It is used by behavior components and is not required by `BaseTile`.
- `UseTileFeedbackOptions` — options for `useTileFeedback`, including the element ref, feedback flags, and completion callbacks.
- `drop-target-helpers` — shared DOM/data-attribute helpers for feature-owned drag target discovery and highlighting.
- `tile-text-overrides` — shared helpers for temporary BaseTile text overrides used by merge previews, keeping callers decoupled from BaseTile's internal text span.
- `useLatestRef` — tiny helper for imperative animation/drag callbacks that need the latest React props without recreating handlers.

## Tile sizing model

The shared sizing system is hitbox-first. Global tokens in `src/index.css` define five CSS-selected width tiers (`x-small`, `small`, `medium`, `large`, `x-large`) around `--tile-hitbox-size`, with `44px` as the x-small minimum interactive cell. The x-small tier is the default token set so narrow-but-tall or otherwise unusual screens can still render; media queries progressively tune larger tiers without JavaScript. Height-specific rules tune history capacity separately. The visible portrait tile uses `--tile-visual-short-edge` × `--tile-visual-long-edge`, preserving the 2:3 ratio inside that square cell; future landscape pool visuals can use the same edges swapped inside the same hitbox.

`BaseTile` renders only the visible card. Pool and other rotation-safe regions may wrap it in square cells/hitboxes and should use the shared `--tile-hitbox-size` and `--tile-gap` tokens to keep pool cadence consistent. Submission and history rows use `--tile-submission-history-gap` so their portrait-only visual spacing can be tuned separately from the pool. The tile tokens are global because these regions need the same hitbox, gap, radius, border padding, font, and shadow values without importing tile component CSS.

## Boundaries

- `BaseTile` is presentation-only: no GSAP imports, no game context, no reducer types, no pool/submission/history behavior, no square hitbox ownership, and no character resolution helpers.
- `CharacterTile` is the only shared tile component that calls `resolveCharacter`.
- Pool, submission, history, and instructions modules own their own interaction semantics and decide when to render these primitives.
- Shared DOM helpers may centralize data-attribute contracts and BaseTile-internal text overrides, but they must not dispatch actions or decide game semantics.
- Visual variants use reusable names such as `result` or `isInteractive`; avoid context names such as `isPoolTile` or `isSubmissionReady` in the shared API.

## Naming

- React components use `PascalCase.tsx` files.
- Supporting hooks and helpers use `kebab-case.ts` files.
- CSS Modules stay colocated with the component that owns the visual rules.
- No index barrel; consumers import directly from the file that owns the export.
