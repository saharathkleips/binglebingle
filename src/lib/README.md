# src/lib

Pure domain logic for Binglebingle. No React imports anywhere in this tree — everything here is unit-testable in isolation and framework-agnostic.

Two sub-modules, ordered by abstraction level:

- [`jamo/`](./jamo/README.md) — Unicode mechanics: lookup tables, syllable block arithmetic, jamo combination and rotation rules
- [`character/`](./character/README.md) — Game model: the `Character` type being assembled by the player, combination state machine, completion rules

The game state reducer and React components sit above this boundary and consume `character/` as their primary interface. They should rarely need to reach into `jamo/` directly.
