/**
 * @file snap-back-animations.ts
 *
 * Cross-owner tile snap-back helpers. These coordinate cloned DOM nodes across
 * React owner changes so a tile can animate smoothly into its new rendered home.
 */

import { SNAP_BACK_ANIMATION } from "./motion-tokens";
import { gsap } from "./register";

const ARRIVAL_LIFT_TRANSFORM =
  "translate(calc(var(--tile-hover-offset) * -1), calc(var(--tile-hover-offset) * -1))";
const ARRIVAL_LIFT_SHADOW = "var(--tile-shadow-stack-lifted)";
const SNAP_BACK_CLONE_STRIPPED_ATTRIBUTES = [
  "id",
  "data-slot-index",
  "data-slot-state",
  "data-tile-id",
] as const;

/** Options captured when recording a cross-owner tile snap-back. */
export type TileSnapBackOptions = {
  /** Whether the destination tile should briefly adopt the hover lift after arrival. */
  shouldLiftOnArrival?: boolean;
};

/** Pending snap-back data consumed by the next rendered instance of the same tile ID. */
export type TileSnapBackSnapshot = {
  /** Visual clone that animates from the release position while React re-parents the real tile. */
  clone: HTMLElement;
  /** Fallback cleanup timer in case the consuming animation never runs. */
  cleanupTimer: ReturnType<typeof setTimeout>;
  /** Whether the destination tile should briefly adopt the hover lift after arrival. */
  shouldLiftOnArrival: boolean;
};

const pendingTileSnapBacks = new Map<number, TileSnapBackSnapshot>();
const snapBackEntranceSuppressedTileIds = new Set<number>();

/**
 * Records where a tile was released before a React state change moves it to a new owner.
 * The next rendered instance with the same tile ID can animate from this screen position.
 *
 * @param tileId - Stable game tile ID that will be rendered elsewhere after dispatch.
 * @param element - Dragged tile element at its final pointer position.
 * @param options - Visual hints for the destination snap-back animation.
 */
export function recordTileSnapBack(
  tileId: number,
  element: HTMLElement,
  options: TileSnapBackOptions = {},
): void {
  const previousSnapshot = pendingTileSnapBacks.get(tileId);
  if (previousSnapshot !== undefined) removeTileSnapBackSnapshot(previousSnapshot);

  const fromRect = element.getBoundingClientRect();
  const clone = element.cloneNode(true) as HTMLElement; // DOM clone preserves the rendered tile surface.
  SNAP_BACK_CLONE_STRIPPED_ATTRIBUTES.forEach((attribute) => clone.removeAttribute(attribute));
  clone.setAttribute("aria-hidden", "true");
  clone.style.position = "fixed";
  clone.style.left = `${fromRect.left}px`;
  clone.style.top = `${fromRect.top}px`;
  clone.style.width = `${fromRect.width}px`;
  clone.style.height = `${fromRect.height}px`;
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.pointerEvents = "none";
  clone.style.zIndex = "10000";
  if (typeof document !== "undefined") document.body.appendChild(clone);

  const cleanupTimer = setTimeout(() => {
    if (pendingTileSnapBacks.get(tileId)?.clone !== clone) return;
    pendingTileSnapBacks.delete(tileId);
    clone.remove();
  }, 0);

  pendingTileSnapBacks.set(tileId, {
    clone,
    cleanupTimer,
    shouldLiftOnArrival: options.shouldLiftOnArrival === true,
  });
}

/**
 * Returns whether a tile has a pending cross-container snap-back animation.
 *
 * @param tileId - Stable game tile ID to check.
 * @returns True when a pending release rect exists for this tile.
 */
export function hasPendingTileSnapBack(tileId: number): boolean {
  return pendingTileSnapBacks.has(tileId);
}

/**
 * Consumes a pending release rect for a tile so the animation runs only once.
 *
 * @param tileId - Stable game tile ID to consume.
 * @returns The captured screen snapshot, or null when no snap-back is pending.
 */
export function popPendingTileSnapBack(tileId: number): TileSnapBackSnapshot | null {
  const snapshot = pendingTileSnapBacks.get(tileId) ?? null;
  pendingTileSnapBacks.delete(tileId);
  if (snapshot !== null) {
    clearTimeout(snapshot.cleanupTimer);
    snapBackEntranceSuppressedTileIds.add(tileId);
  }
  return snapshot;
}

/**
 * Discards a pending release snapshot without marking the tile as having animated.
 *
 * @param tileId - Stable game tile ID to discard.
 */
export function discardPendingTileSnapBack(tileId: number): void {
  const snapshot = pendingTileSnapBacks.get(tileId);
  if (snapshot === undefined) return;

  removeTileSnapBackSnapshot(snapshot);
  pendingTileSnapBacks.delete(tileId);
  snapBackEntranceSuppressedTileIds.delete(tileId);
}

/**
 * Returns whether a tile should skip generic entrance animation because it is already
 * represented by a cross-owner snap-back clone.
 *
 * @param tileId - Stable game tile ID to check.
 * @returns True when snap-back animation should own this tile's entrance.
 */
export function shouldSuppressTileEntranceForSnapBack(tileId: number): boolean {
  return pendingTileSnapBacks.has(tileId) || snapBackEntranceSuppressedTileIds.has(tileId);
}

/**
 * Clears snap-back entrance suppression after the owner has processed the current render.
 *
 * @param tileIds - Tile IDs currently rendered by the owner.
 */
export function clearTileEntranceSnapBackSuppressions(tileIds: Iterable<number>): void {
  Array.from(tileIds).forEach((tileId) => snapBackEntranceSuppressedTileIds.delete(tileId));
}

/**
 * Animates a fixed-position clone into a newly-rendered tile's layout position.
 * The real destination stays invisible until the clone arrives, avoiding a pop/teleport.
 *
 * @param element - Newly-rendered tile element in its destination layout position.
 * @param snapshot - Screen snapshot captured from the dragged source element before dispatch.
 * @param onComplete - Optional callback fired when the animation finishes.
 * @returns A GSAP Tween for the cross-container snap-back animation.
 */
export function animateSnapBackFromRect(
  element: HTMLElement,
  snapshot: TileSnapBackSnapshot,
  onComplete?: () => void,
): gsap.core.Tween {
  const toRect = element.getBoundingClientRect();
  const { clone } = snapshot;
  element.style.visibility = "hidden";
  if (snapshot.shouldLiftOnArrival) {
    syncArrivalLiftVariables(clone, element);
    applyArrivalLift(clone);
    applyArrivalLift(element);
  }

  let hasCleanedUp = false;
  const cleanup = () => {
    if (hasCleanedUp) return;

    hasCleanedUp = true;
    clone.remove();
    element.style.visibility = "";
    if (snapshot.shouldLiftOnArrival) clearArrivalLiftOnNextFrame(element);
  };

  return gsap.to(clone, {
    left: toRect.left,
    top: toRect.top,
    width: toRect.width,
    height: toRect.height,
    ...SNAP_BACK_ANIMATION,
    onComplete: () => {
      cleanup();
      onComplete?.();
    },
    onInterrupt: cleanup,
  });
}

function removeTileSnapBackSnapshot(snapshot: TileSnapBackSnapshot): void {
  clearTimeout(snapshot.cleanupTimer);
  snapshot.clone.remove();
}

function applyArrivalLift(element: HTMLElement): void {
  const surface = findTileSurface(element);
  if (surface === null) return;

  const previousTransition = surface.style.transition;
  surface.style.transition = "none";
  surface.style.transform = ARRIVAL_LIFT_TRANSFORM;
  surface.style.boxShadow = ARRIVAL_LIFT_SHADOW;
  void surface.offsetWidth;
  surface.style.transition = previousTransition;
}

function syncArrivalLiftVariables(clone: HTMLElement, destinationElement: HTMLElement): void {
  if (typeof getComputedStyle !== "function") return;

  const destinationLiftMultiplier = getComputedStyle(destinationElement)
    .getPropertyValue("--tile-hover-lift-multiplier")
    .trim();
  if (destinationLiftMultiplier === "") return;

  clone.style.setProperty("--tile-hover-lift-multiplier", destinationLiftMultiplier);
}

function clearArrivalLiftOnNextFrame(element: HTMLElement): void {
  const schedule =
    globalThis.requestAnimationFrame ??
    ((callback: FrameRequestCallback) => {
      globalThis.setTimeout(callback, 0);
      return 0;
    });

  schedule(() => {
    const surface = findTileSurface(element);
    if (surface === null) return;

    surface.style.transform = "";
    surface.style.boxShadow = "";
  });
}

function findTileSurface(element: HTMLElement): HTMLElement | null {
  return element.querySelector<HTMLElement>("[data-tile-surface]");
}
