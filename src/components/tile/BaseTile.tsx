/**
 * @file BaseTile.tsx
 *
 * Shared visual primitive for tile-like surfaces.
 */

import type { ReactNode } from "react";
import styles from "./BaseTile.module.css";

export type BaseTileElement = "button" | "div" | "span";
export type BaseTileSize = "standard" | "compact";
export type BaseTileTone = "default" | "correct" | "present" | "absent";

/**
 * Props for the {@link BaseTile} component.
 *
 * @property children - Already-renderable tile content.
 * @property className - Optional caller-owned class for layout or context-specific visual additions.
 * @property element - Semantic element to render.
 * @property isDisabled - Whether a button tile should be disabled and visually muted.
 * @property isHighlighted - Whether to show the shared warm highlight treatment.
 * @property isInteractive - Whether the tile should use interactive affordances such as pointer cursor and active feedback.
 * @property label - Accessible label for non-text or abbreviated tile content.
 * @property size - Shared size variant.
 * @property tone - Shared result/state tone.
 */
export type BaseTileProps = {
  children: ReactNode;
  className?: string;
  element?: BaseTileElement;
  isDisabled?: boolean;
  isHighlighted?: boolean;
  isInteractive?: boolean;
  label?: string;
  size?: BaseTileSize;
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
  element = "div",
  isDisabled = false,
  isHighlighted = false,
  isInteractive = false,
  label,
  size = "standard",
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

  if (element === "button") {
    return (
      <button type="button" className={composedClassName} aria-label={label} disabled={isDisabled}>
        {children}
      </button>
    );
  }

  if (element === "span") {
    return (
      <span
        className={composedClassName}
        aria-label={label}
        aria-disabled={isDisabled || undefined}
      >
        {children}
      </span>
    );
  }

  return (
    <div className={composedClassName} aria-label={label} aria-disabled={isDisabled || undefined}>
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
