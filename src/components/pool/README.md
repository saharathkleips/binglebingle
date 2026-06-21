# components/pool

Displays the player's jamo pool as interactive fixed-layout tiles. Tap to rotate or decompose; drag to combine with another pool tile or place into a submission slot.

## Exports

- `Pool` — renders all pool tiles from `useGame()` state; no props
- `PoolTile` — single pool tile; owns GSAP Draggable mechanics and composes shared tile visuals; all game logic lives in Pool

## Behavior Notes

Pool tile positions are owned by the pool layout, not by persisted drag coordinates. GSAP Draggable moves the rendered tile during an active gesture only. Valid drops dispatch reducer actions and React renders the resulting pool/submission state; invalid drags animate back to the tile's fixed layout position and clear inline drag styles.

When a dragged pool tile hovers over a valid pool tile target, Pool computes the merge result and PoolTile exposes it as `data-drop-preview` on the dragged tile so the shared tile CSS can preview the resulting character above the target.

Pool drag behavior uses GSAP Draggable directly on the tile element. This module should not reintroduce raw Pointer Events drag handlers or detached manual ghost elements.
