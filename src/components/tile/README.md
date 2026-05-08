# components/tile

Shared tile presentation primitives for Binglebingle. This module owns reusable tile visuals and character display helpers only; context-specific interaction, animation, and game-state behavior stay in the consuming feature modules.

## Exports

- `BaseTile` — visual primitive for a tile-like surface. Accepts display content, an optional element kind for semantic rendering, safe DOM hooks for consumers (`tileRef`, `dataAttributes`, `testId`, `onAnimationEnd`), and narrow visual variant props. It does not resolve game characters, dispatch actions, read context, configure GSAP, or implement drag/drop behavior.
- `BaseTileProps` — props for `BaseTile`; names describe visual concerns rather than pool, submission, or history behavior.
- `BaseTileElement` — supported semantic elements: `"button"`, `"div"`, or `"span"`.
- `BaseTileSize` — supported visual sizes: `"standard"` or `"compact"`.
- `BaseTileTone` — supported result/state tones: `"default"`, `"correct"`, `"present"`, or `"absent"`.
- `CharacterTile` — character-aware wrapper that accepts a game `Character`, resolves it with `resolveCharacter`, and renders `BaseTile` with the resolved text.
- `CharacterTileProps` — props for `CharacterTile`; mirrors the allowed visual props from `BaseTile` plus the `character` value.
- `useTileFeedback` — shared hook for GSAP tile feedback animations (rotate squeeze, compose pulse/particles, entrance scale). It is used by behavior components and is not required by `BaseTile`.
- `UseTileFeedbackOptions` — options for `useTileFeedback`, including the element ref, feedback flags, and completion callbacks.

## Boundaries

- `BaseTile` is presentation-only: no GSAP imports, no game context, no reducer types, no pool/submission/history behavior, and no character resolution helpers.
- `CharacterTile` is the only shared tile component that calls `resolveCharacter`.
- Pool, submission, history, and instructions modules own their own interaction semantics and decide when to render these primitives.
- Visual variants use reusable names such as `tone`, `size`, `isInteractive`, or `isHighlighted`; avoid context names such as `isPoolTile` or `isSubmissionReady` in the shared API.

## Naming

- React components use `PascalCase.tsx` files.
- Supporting hooks and helpers use `kebab-case.ts` files.
- CSS Modules stay colocated with the component that owns the visual rules.
- No index barrel; consumers import directly from the file that owns the export.
