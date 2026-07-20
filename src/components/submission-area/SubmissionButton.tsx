/**
 * @file SubmissionButton.tsx
 *
 * Renders the button used to submit the current guess.
 */

import { Button, ButtonText } from "../button/Button";
import Hills2 from "./hills-2.svg?react";
import Hills3 from "./hills-3.svg?react";
import styles from "./SubmissionButton.module.css";

/** Props for the submission action button. */
export type SubmissionButtonProps = {
  /** Whether the current guess is not ready to submit. */
  isDisabled: boolean;
  /** Called when the player activates the submit button. */
  onSubmit: () => void;
};

/**
 * Renders the submission button and delegates submit behavior to its owner.
 *
 * @param props - See {@link SubmissionButtonProps}.
 */
export function SubmissionButton({ isDisabled, onSubmit }: SubmissionButtonProps) {
  return (
    <Button
      className={styles.button}
      surfaceClassName={styles.surface}
      onClick={onSubmit}
      disabled={isDisabled}
    >
      <Hills3
        className={`${styles.motif} ${styles.motifLeft}`}
        aria-hidden="true"
        focusable="false"
      />
      <ButtonText className={styles.text} ariaLabel="도전">
        도전
      </ButtonText>
      <Hills2
        className={`${styles.motif} ${styles.motifRight}`}
        aria-hidden="true"
        focusable="false"
      />
    </Button>
  );
}
