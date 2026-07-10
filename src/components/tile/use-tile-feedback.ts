/**
 * @file use-tile-feedback.ts
 *
 * Shared GSAP feedback animations for tile-like elements.
 */

import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import {
  animateComposePulse,
  animateEntranceScale,
  animateParticleBurst,
  animateRotateSqueeze,
} from "../../lib/animation/tile-animations";
import { useLatestRef } from "./use-latest-ref";

export type UseTileFeedbackOptions = {
  elementRef: RefObject<HTMLElement | null>;
  isRotating?: boolean | undefined;
  isJustComposed?: boolean | undefined;
  isNewlyAdded?: boolean | undefined;
  onRotatingEnd?: (() => void) | undefined;
  onComposedEnd?: (() => void) | undefined;
  onNewlyAddedEnd?: (() => void) | undefined;
};

/**
 * Plays shared tile feedback animations on an existing tile element.
 *
 * @param options - Feedback flags, callbacks, and the element ref to animate.
 */
export function useTileFeedback({
  elementRef,
  isRotating = false,
  isJustComposed = false,
  isNewlyAdded = false,
  onRotatingEnd = NOOP,
  onComposedEnd = NOOP,
  onNewlyAddedEnd = NOOP,
}: UseTileFeedbackOptions) {
  const onRotatingEndRef = useLatestRef(onRotatingEnd);
  const onComposedEndRef = useLatestRef(onComposedEnd);
  const onNewlyAddedEndRef = useLatestRef(onNewlyAddedEnd);

  // VIS-21: brief squeeze pulse when the jamo rotates.
  useLayoutEffect(() => {
    if (!isRotating || !elementRef.current) return;
    const tween = animateRotateSqueeze(elementRef.current, () => onRotatingEndRef.current());
    return () => {
      tween.kill();
    };
  }, [elementRef, isRotating, onRotatingEndRef]);

  // VIS-19: scale heartbeat + particle burst on the tile that received a compose.
  useLayoutEffect(() => {
    if (!isJustComposed || !elementRef.current) return;
    const element = elementRef.current;
    const cleanupParticles = animateParticleBurst(element);
    const tween = animateComposePulse(element, () => onComposedEndRef.current());
    return () => {
      tween.kill();
      cleanupParticles();
    };
  }, [elementRef, isJustComposed, onComposedEndRef]);

  // VIS-20: entrance scale for newly-added tiles (decompose results, etc.).
  useLayoutEffect(() => {
    if (!isNewlyAdded || !elementRef.current) return;
    const tween = animateEntranceScale(elementRef.current, () => onNewlyAddedEndRef.current());
    return () => {
      tween.kill();
    };
  }, [elementRef, isNewlyAdded, onNewlyAddedEndRef]);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOOP = () => {};
