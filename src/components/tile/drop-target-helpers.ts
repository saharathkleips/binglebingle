/**
 * @file drop-target-helpers.ts
 *
 * Shared DOM helpers for tile and slot drag/drop target discovery and feedback.
 */

export const DATA_TILE_ID_ATTRIBUTE = "data-tile-id";
export const DATA_SLOT_INDEX_ATTRIBUTE = "data-slot-index";
export const DATA_DROP_POOL_TARGET_ACTIVE_ATTRIBUTE = "data-drop-pool-target-active";
export const DATA_DROP_SLOT_TARGET_ACTIVE_ATTRIBUTE = "data-drop-slot-target-active";

export type DropTargetQuery = {
  acceptedAttributes: readonly string[];
  excludedAttribute?: string;
  excludedValue?: string;
};

export type DropTargetHighlightOptions = {
  previousTarget: Element | null;
  nextTarget: Element | null;
  setActiveAttribute?: (element: Element) => void;
  removeActiveAttribute?: (element: Element) => void;
};

export function findDropTarget(elements: Element[], query: DropTargetQuery): Element | null {
  return elements.find((element) => isDropTarget(element, query)) ?? null;
}

export function updateDropTargetHighlight({
  previousTarget,
  nextTarget,
  setActiveAttribute = setDropTargetActiveAttribute,
  removeActiveAttribute = removeDropTargetActiveAttributes,
}: DropTargetHighlightOptions) {
  if (previousTarget !== null && previousTarget !== nextTarget) {
    removeActiveAttribute(previousTarget);
  }

  if (nextTarget !== null) {
    setActiveAttribute(nextTarget);
  }
}

export function setDropTargetActiveAttribute(element: Element) {
  element.setAttribute(getDropTargetActiveAttribute(element), "true");
}

export function removeDropTargetActiveAttributes(element: Element) {
  DROP_TARGET_ACTIVE_ATTRIBUTES.forEach((attribute) => element.removeAttribute(attribute));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DROP_TARGET_ACTIVE_ATTRIBUTES = [
  DATA_DROP_POOL_TARGET_ACTIVE_ATTRIBUTE,
  DATA_DROP_SLOT_TARGET_ACTIVE_ATTRIBUTE,
];

function isDropTarget(element: Element, query: DropTargetQuery): boolean {
  if (!(element instanceof HTMLElement)) return false;

  const isExcluded =
    query.excludedAttribute !== undefined &&
    query.excludedValue !== undefined &&
    element.getAttribute(query.excludedAttribute) === query.excludedValue;
  if (isExcluded) return false;

  return query.acceptedAttributes.some((attribute) => element.hasAttribute(attribute));
}

function getDropTargetActiveAttribute(element: Element) {
  return element.hasAttribute(DATA_TILE_ID_ATTRIBUTE)
    ? DATA_DROP_POOL_TARGET_ACTIVE_ATTRIBUTE
    : DATA_DROP_SLOT_TARGET_ACTIVE_ATTRIBUTE;
}
