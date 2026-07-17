# SPEC: test-utils

## Purpose

Shared utilities for tests colocated with source files.

## Decisions

- Keep component-test pointer helpers in `src/test-utils/` rather than the root `tests/` folder because `tests/` is reserved for Playwright e2e specs.
- Keep element-dispatched pointer sequences and document-dispatched drag sequences as separate helpers because components use both direct pointer handlers and GSAP Draggable's document-level move/up behavior.
- Keep `dragToElementCenter` as a thin convenience wrapper over `dragSequence` so tests that only care about drop results do not repeat target-center coordinate setup.
- Query game-surface entities through semantic data hooks (`data-tile-id`, `data-slot-index`, `data-history-*`) rather than test-only ids, matching the production drag/drop and animation contracts.
