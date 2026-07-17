# test-utils

Shared helpers for unit and component tests. These utilities support colocated tests under `src/` and are not used by production application code.

## Public API

- `pointerSequence` from `./pointer-events.ts` — dispatches every pointer event in a sequence on one element.
- `dragSequence` from `./pointer-events.ts` — dispatches `pointerdown` on the source element and later pointer events on `document`, matching GSAP Draggable's event model.
- `dragToElementCenter` from `./pointer-events.ts` — drags one element to another element's center and releases it.
- `getTileById`, `getPoolTile`, `getSubmissionSlot`, `getHistoryRow`, `getHistoryTiles`, and `getRequiredElement` from `./dom-selectors.ts` — resolve semantic data-hook selectors used by component tests.
