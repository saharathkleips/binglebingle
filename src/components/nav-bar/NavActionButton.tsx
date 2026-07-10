import { type ReactNode } from "react";
import { Button, ButtonText } from "../button/Button";
import styles from "./NavActionButton.module.css";

type NavActionButtonBaseProps = {
  ariaLabel: string;
  testId?: string;
  isExpanded?: boolean;
  onClick?: () => void;
};

type NavActionButtonProps = NavActionButtonBaseProps &
  (
    | {
        kind?: "text";
        label: string;
      }
    | {
        kind: "icon";
        icon: ReactNode;
      }
  );

/**
 * Circular nav action using the same surface and label treatment as the submission button.
 *
 * @param props - {@link NavActionButtonProps}
 * @returns The rendered nav action button.
 */
export function NavActionButton(props: NavActionButtonProps) {
  return (
    <Button
      className={styles.button}
      surfaceClassName={styles.surface}
      onClick={props.onClick}
      ariaLabel={props.ariaLabel}
      ariaExpanded={props.isExpanded}
      testId={props.testId}
    >
      {props.kind === "icon" ? (
        <span className={styles.contentIcon} aria-hidden="true">
          {props.icon}
        </span>
      ) : (
        <ButtonText className={styles.content} isHidden>
          {props.label}
        </ButtonText>
      )}
    </Button>
  );
}
