/**
 * @file SubmissionSlot.tsx
 *
 * A single slot in the submission row. Empty slots are drop targets (wired in
 * UI-04). Filled slots display the resolved character and return the tile to
 * the pool on tap.
 */

import { type Dispatch } from "react";
import { resolveCharacter } from "../../lib/character";
import type { SubmissionSlot as SubmissionSlotType, GameAction } from "../../context/game";
import styles from "./SubmissionSlot.module.css";

export type SubmissionSlotProps = {
  slot: SubmissionSlotType;
  slotIndex: number;
  dispatch: Dispatch<GameAction>;
};

export function SubmissionSlot({ slot, slotIndex, dispatch }: SubmissionSlotProps) {
  function handleClick() {
    if (slot.state === "FILLED") {
      dispatch({ type: "SUBMISSION_SLOT_REMOVE", payload: { slotIndex } });
    }
  }

  const isFilled = slot.state === "FILLED";
  const display = isFilled ? resolveCharacter(slot.character) : null;
  const className = `${styles.slot} ${isFilled ? styles.filled : styles.empty}`;

  return (
    <button
      type="button"
      className={className}
      onClick={isFilled ? handleClick : undefined}
      data-testid={`slot-${slotIndex}`}
      data-slot-index={slotIndex}
    >
      {display}
    </button>
  );
}
