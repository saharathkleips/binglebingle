import { type ReactNode } from "react";
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
    <button
      type="button"
      className={styles.button}
      onClick={props.onClick}
      aria-label={props.ariaLabel}
      aria-expanded={props.isExpanded}
      data-testid={props.testId}
    >
      <span className={styles.surface}>
        {props.kind === "icon" ? (
          <span className={styles.contentIcon} aria-hidden="true">
            {props.icon}
          </span>
        ) : (
          <span className={styles.content} aria-hidden="true">
            <span className={styles.contentDepth}>{props.label}</span>
            <span className={styles.contentStroke}>{props.label}</span>
            <span className={styles.contentLabel}>{props.label}</span>
          </span>
        )}
      </span>
    </button>
  );
}
