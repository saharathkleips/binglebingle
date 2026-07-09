# components/pool

Displays the player's jamo pool as interactive fixed-layout tiles. Tap to rotate or decompose; drag to combine with another pool tile or place into a submission slot.

## Exports

- `Pool` — renders all pool tiles from `useGame()` state; no props
- `PoolTile` — single pool tile; composes shared tile visuals and pool-specific drag behavior; all game logic lives in Pool
- `usePoolTileDraggable` — hook that owns GSAP Draggable setup, drop-target feedback, merge-preview text override, and pool overflow handling for `PoolTile`

## Behavior Notes

Pool tile positions are owned by the pool layout, not by persisted drag coordinates. GSAP Draggable moves the rendered tile during an active gesture only. Valid drops dispatch reducer actions and React renders the resulting pool/submission state; invalid drags, including rejected compose attempts, animate back to the tile's fixed layout position and clear inline drag styles.

When a dragged pool tile hovers over a target, Pool computes target feedback once: whether the drop is valid and, for valid pool-tile merges, the preview text. PoolTile exposes that preview as `data-drop-preview` on the dragged tile so the shared tile CSS can preview the resulting character above the target.

Pool drag behavior uses GSAP Draggable directly on the tile element through `usePoolTileDraggable`. This module should not reintroduce raw Pointer Events drag handlers or detached manual ghost elements.
