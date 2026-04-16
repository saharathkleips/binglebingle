# src/lib

Pure domain logic for Binglebingle. Rules for everything in this tree:

- No React imports — nothing from `react`
- Pure functions only — no mutation, no I/O
- All exported functions explicitly typed — no inferred return types
- No `throw` in validation or evaluation — return a typed result instead

Six sub-modules, ordered by abstraction level:

- [`jamo/`](./jamo/README.md) — Unicode mechanics: lookup tables, syllable block arithmetic, jamo combination and rotation rules
- [`character/`](./character/README.md) — Game model: the `Character` type being assembled by the player, combination state machine, completion rules
- [`word/`](./word/README.md) — Word type and helpers for constructing and converting sequences of complete syllable characters
- [`puzzle/`](./puzzle/README.md) — Game initialization: loads the word list from a static asset and selects a word by strategy
- [`engine/`](./engine/README.md) — Game rules: submission validation, guess evaluation (correct / present / absent), and scoring

The game state reducer and React components sit above this boundary and consume `character/` and `engine/` as their primary interfaces. They should rarely need to reach into `jamo/` directly.
