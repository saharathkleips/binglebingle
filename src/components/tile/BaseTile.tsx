/**
 * @file BaseTile.tsx
 *
 * Shared visual primitive for tile-like surfaces.
 */

import { clsx } from "clsx";
import { useId } from "react";
import type { AnimationEventHandler, CSSProperties, ReactNode, Ref, SVGProps } from "react";
import LightningBorderSvg from "./lightning-border.svg?react";
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
  const composedClassName = clsx(
    styles.tile,
    element === "button" && styles.button,
    styles[size],
    tone !== "default" && styles[tone],
    isInteractive ? styles.interactive : styles.inert,
    isHighlighted && styles.highlighted,
    isDisabled && styles.disabled,
    className,
  );

  const sharedProps = {
    ...dataAttributes,
    "data-testid": testId,
    "aria-label": label,
    className: composedClassName,
    onAnimationEnd,
  };

  const contents = <TileContents>{children}</TileContents>;

  if (element === "button") {
    return (
      <button
        {...sharedProps}
        ref={(node) => assignRef(tileRef, node)}
        type="button"
        disabled={isDisabled}
      >
        {contents}
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
        {contents}
      </span>
    );
  }

  return (
    <div
      {...sharedProps}
      ref={(node) => assignRef(tileRef, node)}
      aria-disabled={isDisabled || undefined}
    >
      {contents}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TileContentsProps = {
  children: ReactNode;
};

type LightningBorderStyle = CSSProperties & {
  "--tile-border-paint": string;
};

function TileContents({ children }: TileContentsProps) {
  return (
    <>
      <span className={styles.text}>{children}</span>
      <LightningBorder aria-hidden="true" focusable="false" className={styles.border} />
    </>
  );
}

function LightningBorder(props: SVGProps<SVGSVGElement>) {
  const gradientId = `tile-gradient-${useId().replace(/:/g, "")}`;
  const borderStyle: LightningBorderStyle = {
    "--tile-border-paint": `url(#${gradientId})`,
  };

  return (
    <>
      <svg aria-hidden="true" focusable="false" className={styles.borderDefinitions}>
        <defs>
          <linearGradient
            id={gradientId}
            x1="25.5"
            y1="0.5"
            x2="25.5"
            y2="77.5001"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--tile-border-gradient-1)" />
            <stop offset="0.25" stopColor="var(--tile-border-gradient-2)" />
            <stop offset="0.5" stopColor="var(--tile-border-gradient-3)" />
            <stop offset="0.75" stopColor="var(--tile-border-gradient-4)" />
            <stop offset="1" stopColor="var(--tile-border-gradient-5)" />
          </linearGradient>
        </defs>
      </svg>
      <LightningBorderSvg {...props} style={borderStyle} />
    </>
  );
}

function assignRef(ref: Ref<HTMLElement> | undefined, node: HTMLElement | null) {
  if (ref === undefined || ref === null) return;
  if (typeof ref === "function") {
    ref(node);
    return;
  }
  ref.current = node;
}
