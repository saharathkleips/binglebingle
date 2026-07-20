/**
 * @file SubmissionArea.tsx
 *
 * Submission area: a row of SubmissionSlots plus a SubmissionButton.
 * Player assembles syllable characters in slots and submits guesses.
 */

import { useGame } from "../../context/game/GameContext";
import { prepareSubmitGuessTransition } from "../../context/game/round-actions";
import { recordTileSnapBack } from "../../lib/animation/snap-back-animations";
import { resolveCharacter } from "../../lib/character";
import { canSubmit } from "../../lib/engine/validate";
import { DATA_SLOT_INDEX_ATTRIBUTE, DATA_TILE_ID_ATTRIBUTE } from "../tile/drop-target-helpers";
import { SubmissionSlot } from "./SubmissionSlot";
import { SubmissionButton } from "./SubmissionButton";
import type { GameState } from "../../context/game";
import styles from "./SubmissionArea.module.css";

/**
 * Renders the submission row and submit button from game state.
 * Player places tiles into slots, sees resolved characters, and submits guesses.
 */
export function SubmissionArea() {
  const { state, dispatch } = useGame();
  const isSubmitDisabled = canSubmit(state.submission) !== "VALID";

  function handleSubmit() {
    if (isSubmitDisabled) return;

    recordReturnedTileSnapBacks(state);
    dispatch({ type: "ROUND_SUBMISSION_SUBMIT" });
  }

  return (
    <section className={styles.submissionArea} aria-label="Submission area">
      <div className={styles.slots} data-submission-slots>
        {state.submission.map((slot, index) => (
          <SubmissionSlot
            key={index}
            slot={slot}
            slotIndex={index}
            onTap={() =>
              dispatch({ type: "SUBMISSION_SLOT_REMOVE", payload: { slotIndex: index } })
            }
            onDropOnSlot={(toSlotIndex) =>
              dispatch({
                type: "SUBMISSION_SLOT_MOVE",
                payload: { fromSlotIndex: index, toSlotIndex },
              })
            }
            onDropOnPool={() =>
              dispatch({ type: "SUBMISSION_SLOT_REMOVE", payload: { slotIndex: index } })
            }
          />
        ))}
      </div>
      <SubmissionButton isDisabled={isSubmitDisabled} onSubmit={handleSubmit} />
    </section>
  );
}

function recordReturnedTileSnapBacks(state: GameState): void {
  prepareSubmitGuessTransition(state).returnedTilesBySlot.forEach(({ slotIndex, tiles }) => {
    const sourceElement = findFilledSlotTileElement(slotIndex);
    if (sourceElement === null) return;

    tiles.forEach((tile) => {
      recordTileSnapBack(tile.id, sourceElement, {
        cloneText: resolveCharacter(tile.character) ?? "",
      });
    });
  });
}

function findFilledSlotTileElement(slotIndex: number): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `[data-submission-slots] [${DATA_SLOT_INDEX_ATTRIBUTE}="${slotIndex}"][${DATA_TILE_ID_ATTRIBUTE}]`,
  );
}
