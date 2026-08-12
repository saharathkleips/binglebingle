/**
 * @file drop-target-helpers.ts
 *
 * Shared DOM helpers for tile and slot drag/drop target discovery and feedback.
 */

import {
  DATA_DROP_POOL_TARGET_ACTIVE_ATTRIBUTE,
  DATA_DROP_SLOT_TARGET_ACTIVE_ATTRIBUTE,
  DATA_POOL_TILE_HITBOX_ID_ATTRIBUTE,
  DATA_TILE_ID_ATTRIBUTE,
  dataAttributeSelector,
} from "../../lib/dom-data-attributes";

/** Query configuration for finding a data-attribute-backed drop target. */
export type DropTargetQuery = {
  /** Data attributes that identify acceptable drop targets. */
  acceptedAttributes: readonly string[];
  /** Optional attributes used to exclude the dragged source from target matching. */
  excludedAttributes?: readonly string[];
  /** Optional attribute value paired with `excludedAttributes` for self-exclusion. */
  excludedValue?: string;
};

/** Active-target transition state for drag hover feedback. */
export type DropTargetHighlightOptions = {
  /** Previously highlighted drop target, if any. */
  previousTarget: Element | null;
  /** Newly highlighted drop target, if any. */
  nextTarget: Element | null;
  /** Applies the active feedback attribute to `nextTarget`. */
  setActiveAttribute?: (element: Element) => void;
  /** Removes active feedback attributes from `previousTarget`. */
  removeActiveAttribute?: (element: Element) => void;
};

/** Parsed pool/submission tile drop target. */
export type DropTargetTile = {
  /** Element carrying the target tile data attribute. */
  element: HTMLElement;
  /** Parsed stable game tile ID for the target element. */
  tileId: number;
};

/**
 * Finds the first element matching shared drag-target data attributes.
 *
 * @param elements - Hit-test elements ordered from front to back.
 * @param query - Accepted attributes and optional self-exclusion rule.
 * @returns The matching drop target, or null.
 */
export function findDropTarget(
  elements: readonly Element[],
  query: DropTargetQuery,
): Element | null {
  return elements.find((element) => isDropTarget(element, query)) ?? null;
}

/**
 * Moves active drop-target feedback from the previous element to the next element.
 *
 * @param options - Previous/next targets and optional attribute handlers.
 */
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

/**
 * Sets the pool or slot active-feedback attribute appropriate for a target element.
 *
 * @param element - Drop target element.
 */
export function setDropTargetActiveAttribute(element: Element) {
  element.setAttribute(getDropTargetActiveAttribute(element), "true");
}

/**
 * Clears all shared drop-target active-feedback attributes from an element.
 *
 * @param element - Drop target element.
 */
export function removeDropTargetActiveAttributes(element: Element) {
  DROP_TARGET_ACTIVE_ATTRIBUTES.forEach((attribute) => element.removeAttribute(attribute));
}

/**
 * Parses an integer-valued data attribute from a drop target.
 *
 * @param element - Element containing the data attribute.
 * @param attribute - Attribute name to parse.
 * @returns The parsed integer, or null when absent/invalid.
 */
export function parseDropTargetNumber(element: Element, attribute: string): number | null {
  const value = element.getAttribute(attribute);
  if (value === null) return null;

  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) ? parsedValue : null;
}

/**
 * Finds a tile element and id inside a possibly larger drop target wrapper.
 *
 * @param dropTarget - Drop target or wrapper element.
 * @returns The tile element and id, or null.
 */
export function findDropTargetTile(dropTarget: Element): DropTargetTile | null {
  const tileElement = findTileElement(dropTarget);
  if (tileElement === null) return null;

  const tileId = parseDropTargetNumber(tileElement, DATA_TILE_ID_ATTRIBUTE);
  return tileId === null ? null : { element: tileElement, tileId };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DROP_TARGET_ACTIVE_ATTRIBUTES = [
  DATA_DROP_POOL_TARGET_ACTIVE_ATTRIBUTE,
  DATA_DROP_SLOT_TARGET_ACTIVE_ATTRIBUTE,
];

function findTileElement(dropTarget: Element): HTMLElement | null {
  const tileElement = dropTarget.hasAttribute(DATA_TILE_ID_ATTRIBUTE)
    ? dropTarget
    : dropTarget.querySelector(dataAttributeSelector(DATA_TILE_ID_ATTRIBUTE));

  return tileElement instanceof HTMLElement ? tileElement : null;
}

function isDropTarget(element: Element, query: DropTargetQuery): boolean {
  if (!(element instanceof HTMLElement)) return false;

  const isExcluded =
    query.excludedValue !== undefined &&
    query.excludedAttributes?.some(
      (attribute) => element.getAttribute(attribute) === query.excludedValue,
    );
  if (isExcluded) return false;

  return query.acceptedAttributes.some((attribute) => element.hasAttribute(attribute));
}

function getDropTargetActiveAttribute(element: Element) {
  return element.hasAttribute(DATA_TILE_ID_ATTRIBUTE) ||
    element.hasAttribute(DATA_POOL_TILE_HITBOX_ID_ATTRIBUTE)
    ? DATA_DROP_POOL_TARGET_ACTIVE_ATTRIBUTE
    : DATA_DROP_SLOT_TARGET_ACTIVE_ATTRIBUTE;
}
