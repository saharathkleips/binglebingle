/**
 * @file Lotus.tsx
 *
 * Decorative lotus-backed tile silhouette used for empty card-like surfaces.
 */

import { clsx } from "clsx";
import { DATA_LOTUS_TILE_BACK_ATTRIBUTE } from "../../lib/dom-data-attributes";
import LotusMotif from "./lotus.svg?react";
import styles from "./Lotus.module.css";

/** Props for the decorative lotus tile back. */
export type LotusProps = {
  /** Additional class name for the tile-back wrapper. */
  className?: string | undefined;
  /** Additional data attributes for caller-specific DOM coordination. */
  dataAttributes?: Record<`data-${string}`, string | number | boolean> | undefined;
};

/** Renders a decorative lotus tile back. */
export function Lotus({ className, dataAttributes = {} }: LotusProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx(styles.tileBack, className)}
      {...{ ...dataAttributes, [DATA_LOTUS_TILE_BACK_ATTRIBUTE]: true }}
    >
      <LotusMotif className={styles.motif} />
    </span>
  );
}
