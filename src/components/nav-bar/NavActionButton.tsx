import { type ReactNode } from "react";
import styles from "./NavActionButton.module.css";

type NavActionButtonProps = {
  ariaLabel: string;
  children: ReactNode;
  testId: string;
  isExpanded?: boolean;
  onClick?: () => void;
};

/**
 * Circular nav action using the same surface and label treatment as the submission button.
 *
 * @param props - {@link NavActionButtonProps}
 * @returns The rendered nav action button.
 */
export function NavActionButton({
  ariaLabel,
  children,
  testId,
  isExpanded,
  onClick,
}: NavActionButtonProps) {
  const expandedProps = isExpanded === undefined ? {} : { "aria-expanded": isExpanded };

  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid={testId}
      {...expandedProps}
    >
      <span className={styles.surface}>
        <span className={styles.content} aria-hidden="true">
          <span className={styles.contentDepth}>{children}</span>
          <span className={styles.contentStroke}>{children}</span>
          <span className={styles.contentLabel}>{children}</span>
        </span>
      </span>
    </button>
  );
}
