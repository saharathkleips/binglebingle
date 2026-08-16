/**
 * @file dom-data-attributes.ts
 *
 * Shared data-attribute names used for drag/drop hit testing, animation DOM
 * coordination, and stable test/demo selectors.
 */

/** Stable game tile ID on a rendered tile element. */
export const DATA_TILE_ID_ATTRIBUTE = "data-tile-id";
/** Stable game tile ID on a pool tile's full interactive hitbox. */
export const DATA_POOL_TILE_HITBOX_ID_ATTRIBUTE = "data-pool-tile-hitbox-id";
/** Zero-based submission slot index on slot hitboxes and filled tiles. */
export const DATA_SLOT_INDEX_ATTRIBUTE = "data-slot-index";
/** Active drop feedback marker for pool tile targets. */
export const DATA_DROP_POOL_TARGET_ACTIVE_ATTRIBUTE = "data-drop-pool-target-active";
/** Active drop feedback marker for submission slot targets. */
export const DATA_DROP_SLOT_TARGET_ACTIVE_ATTRIBUTE = "data-drop-slot-target-active";
/** Active drag feedback marker for the source tile. */
export const DATA_DROP_SOURCE_ACTIVE_ATTRIBUTE = "data-drop-source-active";
/** Temporary drag preview text marker on the source tile. */
export const DATA_DROP_PREVIEW_ATTRIBUTE = "data-drop-preview";
/** Original tile text stored while a drag preview is active. */
export const DATA_TILE_ORIGINAL_TEXT_ATTRIBUTE = "data-drop-original-text";
/** Submission slot hitbox marker used by drag/drop and reveal animations. */
export const DATA_SLOT_HITBOX_ATTRIBUTE = "data-slot-hitbox";
/** Submission slots container marker. */
export const DATA_SUBMISSION_SLOTS_ATTRIBUTE = "data-submission-slots";
/** Generic lotus tile-back marker used by decoration, tests, and animation styling. */
export const DATA_LOTUS_TILE_BACK_ATTRIBUTE = "data-lotus-tile-back";
/** Placeholder silhouette inside a submission slot. */
export const DATA_SUBMISSION_SLOT_PLACEHOLDER_ATTRIBUTE = "data-submission-slot-placeholder";
/** Temporary clone used while submitted slots reveal into history. */
export const DATA_SUBMISSION_HISTORY_REVEAL_CARD_ATTRIBUTE = "data-submission-history-reveal-card";
/** Temporary spacer used to reserve scroll room in history during submit reveal. */
export const DATA_HISTORY_ANIMATION_SPACER_ATTRIBUTE = "data-history-animation-spacer";
/** Guess history scroll container marker. */
export const DATA_HISTORY_AREA_ATTRIBUTE = "data-history-area";
/** Zero-based history row index marker. */
export const DATA_HISTORY_ROW_INDEX_ATTRIBUTE = "data-history-row-index";
/** Revealed history card marker. */
export const DATA_HISTORY_CARD_ATTRIBUTE = "data-history-card";
/** Empty history-card marker for subdued placeholder styling. */
export const DATA_HISTORY_EMPTY_CARD_ATTRIBUTE = "data-history-empty-card";
/** Evaluation result marker for non-empty revealed cards and animation clones. */
export const DATA_RESULT_ATTRIBUTE = "data-result";
/** Pool container marker used by tests and demos. */
export const DATA_POOL_ATTRIBUTE = "data-pool";
/** Pool input lock marker used by tests and demos. */
export const DATA_INPUT_LOCKED_ATTRIBUTE = "data-input-locked";
/** Submission animation marker used by tests and demos. */
export const DATA_SUBMISSION_ANIMATING_ATTRIBUTE = "data-submission-animating";
/** Filled slot wrapper marker while its tile is being dragged. */
export const DATA_SLOT_DRAGGING_ATTRIBUTE = "data-slot-dragging";
/** Optional local stacking context for tile animation clones, used by demos and overlays. */
export const DATA_TILE_ANIMATION_LAYER_ATTRIBUTE = "data-tile-animation-layer";
/** Tile text element marker used when animation clones temporarily override text. */
export const DATA_TILE_TEXT_ATTRIBUTE = "data-tile-text";
/** Tile surface marker used by animation helpers for visual state. */
export const DATA_TILE_SURFACE_ATTRIBUTE = "data-tile-surface";
/** Tile border ornament marker. */
export const DATA_TILE_BORDER_ATTRIBUTE = "data-tile-border";
/** Submission slot state marker. */
export const DATA_SLOT_STATE_ATTRIBUTE = "data-slot-state";
/** Interactive tile marker. */
export const DATA_TILE_INTERACTIVE_ATTRIBUTE = "data-tile-interactive";
/** Temporarily suppresses hover lift until the pointer leaves a newly placed tile. */
export const DATA_TILE_HOVER_SUPPRESSED_ATTRIBUTE = "data-tile-hover-suppressed";

/**
 * Builds a CSS selector for elements carrying a shared data attribute.
 *
 * @param attribute - Data attribute name, for example `data-tile-id`.
 * @param value - Optional exact attribute value to match.
 * @returns A CSS attribute selector such as `[data-tile-id="3"]`.
 */
export function dataAttributeSelector(
  attribute: string,
  value?: string | number | boolean,
): string {
  if (value === undefined) return `[${attribute}]`;

  return `[${attribute}="${escapeAttributeSelectorValue(String(value))}"]`;
}

function escapeAttributeSelectorValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
