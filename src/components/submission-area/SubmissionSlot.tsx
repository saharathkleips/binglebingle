/**
 * @file SubmissionSlot.tsx
 *
 * A single slot in the submission row. Empty slots are drop targets.
 * Filled slots display the resolved character, return the tile to the
 * pool on tap, and can be dragged to another slot to swap positions.
 */

import { useRef, useLayoutEffect } from "react";
import { gsap } from "../../lib/animation/register";
import { CharacterTile } from "../tile/CharacterTile";
import { DATA_SLOT_INDEX_ATTRIBUTE, DATA_TILE_ID_ATTRIBUTE } from "../tile/drop-target-helpers";
import type { SubmissionSlot as SubmissionSlotType } from "../../context/game";
import { useSubmissionSlotDraggable } from "./use-submission-slot-draggable";
import Lotus from "./lotus.svg?react";
import styles from "./SubmissionSlot.module.css";

/**
 * @property slot - The slot state (empty or filled with a tile).
 * @property slotIndex - Index of this slot in the submission array.
 * @property isSubmitting - SubmissionArea sets this while evaluating a guess; slot plays a pulse.
 * @property onTap - Called when a filled slot is tapped; parent removes the tile.
 * @property onDropOnSlot - Called when a drag ends on another slot, with that slot's index.
 * @property onDropOnPool - Called when a drag ends over the pool; parent returns the tile.
 */
export type SubmissionSlotProps = {
  slot: SubmissionSlotType;
  slotIndex: number;
  isSubmitting?: boolean;
  onTap: () => void;
  onDropOnSlot: (toSlotIndex: number) => void;
  onDropOnPool?: () => void;
};

/**
 * Renders a single submission slot. Empty slots are drop targets; filled slots
 * show the resolved character and return the tile to the pool on tap.
 *
 * @param props - {@link SubmissionSlotProps}
 */
export function SubmissionSlot({
  slot,
  slotIndex,
  isSubmitting = false,
  onTap,
  onDropOnSlot,
  onDropOnPool = () => {},
}: SubmissionSlotProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isFilled = slot.state === "FILLED";
  // Stable key for detecting swaps: which tile ID occupies this slot.
  const filledTileId = slot.state === "FILLED" ? slot.tileId : null;

  // Clear any stale GSAP transforms before the entrance animation captures the element's
  // natural state as its "to" value. revertOnUpdate can record scale:0.6 (the "from"
  // value set synchronously by gsap.from) as the pre-animation snapshot and restore it
  // on a swap (filledTileId changes while isFilled stays true). If the snapshot is 0.6,
  // the new gsap.from captures 0.6 as its target → animates 0.6→0.6, stuck tiny.
  // React runs ALL cleanups before ALL setups (declaration order), so this setup fires
  // before useGSAP's setup, giving gsap.from a clean element to read.
  useLayoutEffect(() => {
    if (!isFilled || !buttonRef.current) return;
    gsap.set(buttonRef.current, { clearProps: "all" });
  }, [isFilled, filledTileId]);

  useSubmissionSlotDraggable({
    buttonRef,
    isFilled,
    filledTileId,
    slotIndex,
    onTap,
    onDropOnSlot,
    onDropOnPool,
  });

  // Clear any stale GSAP transforms when the slot becomes empty.
  // gsap.from() inside useGSAP sets scale: 0.6 synchronously as its "from" value.
  // revertOnUpdate can record that 0.6 as the pre-animation state and restore it,
  // leaving the empty slot visually shrunk. Running clearProps here (after useGSAP's
  // revert) ensures the element is clean before the next fill.
  useLayoutEffect(() => {
    if (isFilled || !buttonRef.current) return;
    gsap.set(buttonRef.current, { clearProps: "all" });
  }, [isFilled]);

  // VIS-24: brief scale pulse on all filled slots when a guess is being submitted.
  useLayoutEffect(() => {
    if (!isSubmitting || !isFilled || !buttonRef.current) return;
    const tween = gsap.to(buttonRef.current, {
      scale: 1.09,
      duration: 0.1,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
    });
    return () => {
      tween.kill();
    };
  }, [isSubmitting, isFilled]);

  const slotPlaceholder = (
    <span aria-hidden="true" className={styles.slotPlaceholder}>
      <Lotus className={styles.slotMotif} />
    </span>
  );

  const button = isFilled ? (
    <CharacterTile
      character={slot.character}
      element="button"
      className={styles.filled ?? ""}
      isInteractive
      ref={buttonRef}
      testId={`slot-${slotIndex}`}
      dataAttributes={{
        [DATA_SLOT_INDEX_ATTRIBUTE]: slotIndex,
        [DATA_TILE_ID_ATTRIBUTE]: slot.tileId,
        "data-slot-state": "filled",
      }}
    />
  ) : (
    <button
      ref={buttonRef}
      type="button"
      className={`${styles.slot} ${styles.empty}`}
      data-testid={`slot-${slotIndex}`}
      {...{ [DATA_SLOT_INDEX_ATTRIBUTE]: slotIndex }}
      data-slot-state="empty"
      data-slot-hitbox
    >
      {slotPlaceholder}
    </button>
  );

  // When filled, wrap in a ghost div that stays at the original slot position
  // while the button is dragged away. The ghost shows the empty-slot appearance
  // so there is always a visible indicator of where the slot is.
  if (isFilled) {
    return (
      <div
        className={styles.slotGhost}
        {...{ [DATA_SLOT_INDEX_ATTRIBUTE]: slotIndex }}
        data-slot-state="filled"
        data-slot-hitbox
      >
        {button}
        {slotPlaceholder}
      </div>
    );
  }

  return button;
}
