/**
 * @file BaseTile.tsx
 *
 * Shared visual primitive for tile-like surfaces.
 */

import { clsx } from "clsx";
import type { AnimationEventHandler, ReactNode, Ref } from "react";
import type { CharacterResult } from "../../lib/engine";
import styles from "./BaseTile.module.css";

export type BaseTileElement = "button" | "div" | "span";

/** Props shared by every {@link BaseTile} element variant. */
type BaseTileSharedProps = {
  /** Already-renderable tile content. */
  children: ReactNode;
  /** Optional caller-owned class for layout or context-specific visual additions. */
  className?: string | undefined;
  /** Optional data attributes owned by the consuming feature. */
  dataAttributes?: Record<`data-${string}`, string | number | boolean>;
  /** Whether the tile should use interactive affordances such as pointer cursor and active feedback. */
  isInteractive?: boolean;
  /** Accessible label for non-text or abbreviated tile content. */
  label?: string;
  /** Optional animation-end handler for caller-owned CSS feedback. */
  onAnimationEnd?: AnimationEventHandler<HTMLElement>;
  /** Optional engine evaluation result for result-colored tiles. */
  result?: CharacterResult;
};

/** Props for a button-backed {@link BaseTile}. */
export type BaseTileButtonProps = BaseTileSharedProps & {
  /** Renders a native button for interactive tiles. */
  element: "button";
  /** Ref to the rendered button element. */
  ref?: Ref<HTMLButtonElement>;
};

/** Props for a div-backed {@link BaseTile}. */
export type BaseTileDivProps = BaseTileSharedProps & {
  /** Renders a non-interactive block tile; omitted element defaults to `div`. */
  element?: "div";
  /** Ref to the rendered div element. */
  ref?: Ref<HTMLDivElement>;
};

/** Props for a span-backed {@link BaseTile}. */
export type BaseTileSpanProps = BaseTileSharedProps & {
  /** Renders an inline tile for compact text-like contexts. */
  element: "span";
  /** Ref to the rendered span element. */
  ref?: Ref<HTMLSpanElement>;
};

/** Props for the {@link BaseTile} component. */
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
  } = props;
  const composedClassName = clsx(styles.tile, className);
  const sharedProps = {
    ...dataAttributes,
    "data-tile-interactive": isInteractive || undefined,
    "data-tile-result": result,
    "aria-label": label,
    className: composedClassName,
    onAnimationEnd,
  };
  const contents = (
    <span data-tile-surface>
      <span data-tile-text>{children}</span>
      <span aria-hidden="true" data-tile-border />
    </span>
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
