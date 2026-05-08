/**
 * @file BaseTile.tsx
 *
 * Shared visual primitive for tile-like surfaces.
 */

import type { AnimationEventHandler, ReactNode, Ref } from "react";
import styles from "./BaseTile.module.css";

export type BaseTileElement = "button" | "div" | "span";
export type BaseTileSize = "standard" | "compact";
export type BaseTileTone = "default" | "correct" | "present" | "absent";

/**
 * Props for the {@link BaseTile} component.
 *
 * @property children - Already-renderable tile content.
 * @property className - Optional caller-owned class for layout or context-specific visual additions.
 * @property dataAttributes - Optional data attributes owned by the consuming feature.
 * @property element - Semantic element to render.
 * @property isDisabled - Whether a button tile should be disabled and visually muted.
 * @property isHighlighted - Whether to show the shared warm highlight treatment.
 * @property isInteractive - Whether the tile should use interactive affordances such as pointer cursor and active feedback.
 * @property label - Accessible label for non-text or abbreviated tile content.
 * @property onAnimationEnd - Optional animation-end handler for caller-owned CSS feedback.
 * @property size - Shared size variant.
 * @property testId - Optional test id for observable UI tests.
 * @property tileRef - Optional ref to the rendered tile element for context-specific behavior.
 * @property tone - Shared result/state tone.
 */
export type BaseTileProps = {
  children: ReactNode;
  className?: string;
  dataAttributes?: Record<`data-${string}`, string | number | boolean>;
  element?: BaseTileElement;
  isDisabled?: boolean;
  isHighlighted?: boolean;
  isInteractive?: boolean;
  label?: string;
  onAnimationEnd?: AnimationEventHandler<HTMLElement>;
  size?: BaseTileSize;
  testId?: string;
  tileRef?: Ref<HTMLElement>;
  tone?: BaseTileTone;
};

/**
 * Renders the shared tile surface without game state, character resolution,
 * animation setup, or interaction behavior.
 *
 * @param props - See {@link BaseTileProps}.
 */
export function BaseTile({
  children,
  className,
  dataAttributes,
  element = "div",
  isDisabled = false,
  isHighlighted = false,
  isInteractive = false,
  label,
  onAnimationEnd,
  size = "standard",
  testId,
  tileRef,
  tone = "default",
}: BaseTileProps) {
  const composedClassName = composeClassName([
    styles.tile,
    element === "button" ? styles.button : null,
    styles[size],
    tone === "default" ? null : styles[tone],
    isInteractive ? styles.interactive : styles.inert,
    isHighlighted ? styles.highlighted : null,
    isDisabled ? styles.disabled : null,
    className,
  ]);

  const sharedProps = {
    ...dataAttributes,
    "data-testid": testId,
    "aria-label": label,
    className: composedClassName,
    onAnimationEnd,
  };

  if (element === "button") {
    return (
      <button
        {...sharedProps}
        ref={(node) => assignRef(tileRef, node)}
        type="button"
        disabled={isDisabled}
      >
        {children}
      </button>
    );
  }

  if (element === "span") {
    return (
      <span
        {...sharedProps}
        ref={(node) => assignRef(tileRef, node)}
        aria-disabled={isDisabled || undefined}
      >
        {children}
      </span>
    );
  }

  return (
    <div
      {...sharedProps}
      ref={(node) => assignRef(tileRef, node)}
      aria-disabled={isDisabled || undefined}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function composeClassName(classNames: Array<string | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function assignRef(ref: Ref<HTMLElement> | undefined, node: HTMLElement | null) {
  if (ref === undefined || ref === null) return;
  if (typeof ref === "function") {
    ref(node);
    return;
  }
  ref.current = node;
}
