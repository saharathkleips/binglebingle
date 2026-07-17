import { type ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonProps = {
  children: ReactNode;
  ariaExpanded?: boolean | undefined;
  ariaLabel?: string | undefined;
  className?: string | undefined;
  disabled?: boolean | undefined;
  onClick?: (() => void) | undefined;
  surfaceClassName?: string | undefined;
  type?: "button" | "submit" | "reset";
};

export type ButtonTextProps = {
  children: string;
  ariaLabel?: string | undefined;
  className?: string | undefined;
  isHidden?: boolean | undefined;
};

/**
 * Shared system button with a stable hitbox and moving depth surface.
 *
 * @param props - Button content, DOM hooks, and local class names for sizing/shape.
 * @returns The rendered button element.
 */
export function Button({
  children,
  ariaExpanded,
  ariaLabel,
  className,
  disabled = false,
  onClick,
  surfaceClassName,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(styles.button, className)}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      disabled={disabled}
    >
      <span className={joinClassNames(styles.surface, surfaceClassName)}>{children}</span>
    </button>
  );
}

/**
 * Layered gradient text treatment for shared system buttons.
 *
 * @param props - Text content plus accessibility and local sizing hooks.
 * @returns The rendered layered text span.
 */
export function ButtonText({ children, ariaLabel, className, isHidden = false }: ButtonTextProps) {
  return (
    <span
      className={joinClassNames(styles.text, className)}
      aria-hidden={isHidden || undefined}
      aria-label={isHidden ? undefined : ariaLabel}
    >
      <span className={styles.textDepth} aria-hidden="true">
        {children}
      </span>
      <span className={styles.textStroke} aria-hidden="true">
        {children}
      </span>
      <span className={styles.textLabel} aria-hidden="true">
        {children}
      </span>
    </span>
  );
}

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter((className) => className !== undefined && className !== "").join(" ");
}
