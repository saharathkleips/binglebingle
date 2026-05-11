/**
 * @file BaseTile.tsx
 *
 * Shared visual primitive for tile-like surfaces.
 */

import { clsx } from "clsx";
import type { AnimationEventHandler, CSSProperties, ReactNode, Ref } from "react";
import type { CharacterResult } from "../../lib/engine";
import lightningBorderUrl from "./lightning-border.svg?url";
import styles from "./BaseTile.module.css";

export type BaseTileElement = "button" | "div" | "span";

/**
 * Props shared by every {@link BaseTile} element variant.
 *
 * @property children - Already-renderable tile content.
 * @property className - Optional caller-owned class for layout or context-specific visual additions.
 * @property dataAttributes - Optional data attributes owned by the consuming feature.
 * @property isInteractive - Whether the tile should use interactive affordances such as pointer cursor and active feedback.
 * @property label - Accessible label for non-text or abbreviated tile content.
 * @property onAnimationEnd - Optional animation-end handler for caller-owned CSS feedback.
 * @property testId - Optional test id for observable UI tests.
 * @property result - Optional engine evaluation result for result-colored tiles.
 */
type BaseTileSharedProps = {
  children: ReactNode;
  className?: string;
  dataAttributes?: Record<`data-${string}`, string | number | boolean>;
  isInteractive?: boolean;
  label?: string;
  onAnimationEnd?: AnimationEventHandler<HTMLElement>;
  testId?: string;
  result?: CharacterResult;
};

/** Props for a button-backed {@link BaseTile}. */
export type BaseTileButtonProps = BaseTileSharedProps & {
  element: "button";
  ref?: Ref<HTMLButtonElement>;
};

/** Props for a div-backed {@link BaseTile}. */
export type BaseTileDivProps = BaseTileSharedProps & {
  element?: "div";
  ref?: Ref<HTMLDivElement>;
};

/** Props for a span-backed {@link BaseTile}. */
export type BaseTileSpanProps = BaseTileSharedProps & {
  element: "span";
  ref?: Ref<HTMLSpanElement>;
};

/**
 * Props for the {@link BaseTile} component.
 *
 * @property element - Semantic element to render.
 */
export type BaseTileProps = BaseTileButtonProps | BaseTileDivProps | BaseTileSpanProps;

/**
 * Renders the shared tile surface without game state, character resolution,
 * animation setup, or interaction behavior.
 *
 * @param props - See {@link BaseTileProps}.
 */
export function BaseTile(props: BaseTileProps) {
  const {
    children,
    className,
    dataAttributes,
    isInteractive = false,
    label,
    onAnimationEnd,
    result,
    testId,
  } = props;
  const composedClassName = clsx(styles.tile, className);
  const sharedProps = {
    ...dataAttributes,
    "data-testid": testId,
    "data-tile-interactive": isInteractive || undefined,
    "data-tile-result": result,
    "aria-label": label,
    className: composedClassName,
    onAnimationEnd,
  };
  const contents = (
    <>
      <span data-tile-text>{children}</span>
      <LightningBorder />
    </>
  );

  if (props.element === "button") {
    return (
      <button {...sharedProps} ref={props.ref} type="button">
        {contents}
      </button>
    );
  }

  if (props.element === "span") {
    return (
      <span {...sharedProps} ref={props.ref}>
        {contents}
      </span>
    );
  }

  return (
    <div {...sharedProps} ref={props.ref}>
      {contents}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type LightningBorderStyle = CSSProperties & {
  "--tile-border-mask-image": string;
};

function LightningBorder() {
  const borderStyle: LightningBorderStyle = {
    "--tile-border-mask-image": `url("${lightningBorderUrl}")`,
  };

  return <span aria-hidden="true" data-tile-border style={borderStyle} />;
}
