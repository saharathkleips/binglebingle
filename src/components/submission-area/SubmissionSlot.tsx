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
 * @property onTap - Called when a filled slot is tapped; parent removes the tile.
 * @property onDropOnSlot - Called when a drag ends on another slot, with that slot's index.
 * @property onDropOnPool - Called when a drag ends over the pool; parent returns the tile.
 */
export type SubmissionSlotProps = {
  slot: SubmissionSlotType;
  slotIndex: number;
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
  onTap,
  onDropOnSlot,
  onDropOnPool = () => {},
}: SubmissionSlotProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isFilled = slot.state === "FILLED";
  // Stable key for detecting swaps: which tile ID occupies this slot.
  const filledTileId = slot.state === "FILLED" ? slot.tileId : null;

  // Clear stale transforms before the entrance helper captures the element's natural
  // state as its "to" value. GSAP from-tweens set their starting scale synchronously;
  // if revertOnUpdate restores that scale on a swap, the next entrance can capture the
  // old start scale as its target and stay tiny. React runs ALL cleanups before ALL
  // setups (declaration order), so this setup fires before useGSAP's setup.
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
  // The entrance from-tween inside useGSAP sets its starting scale synchronously.
  // revertOnUpdate can record that as the pre-animation state and restore it,
  // leaving the empty slot visually shrunk. Running clearProps here (after useGSAP's
  // revert) ensures the element is clean before the next fill.
  useLayoutEffect(() => {
    if (isFilled || !buttonRef.current) return;
    gsap.set(buttonRef.current, { clearProps: "all" });
  }, [isFilled]);

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
