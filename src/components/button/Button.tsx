import { type ReactNode, type Ref } from "react";
import styles from "./Button.module.css";

/** Props for the shared system {@link Button}. */
export type ButtonProps = {
  /** Button content rendered inside the moving surface layer. */
  children: ReactNode;
  /** Forwarded to `aria-expanded` for disclosure-style buttons. */
  ariaExpanded?: boolean | undefined;
  /** Accessible label for icon-only or visually abbreviated buttons. */
  ariaLabel?: string | undefined;
  /** Local footprint, radius, and layout classes belong to consumers. */
  className?: string | undefined;
  /** Disables native button interaction and shared active feedback. */
  disabled?: boolean | undefined;
  /** Ref for consumers that need to measure or focus the native button. */
  ref?: Ref<HTMLButtonElement> | undefined;
  /** Click handler for the button action. */
  onClick?: (() => void) | undefined;
  /** Local surface classes let consumers shape the moving layer while preserving shared depth behavior. */
  surfaceClassName?: string | undefined;
  /** Native button type; defaults to `button` to avoid accidental form submission. */
  type?: "button" | "submit" | "reset";
};

/** Props for the layered text treatment used inside shared system buttons. */
export type ButtonTextProps = {
  /** Visible text copied into each decorative layer. */
  children: string;
  /** Accessible label when the visible text is abbreviated or symbolic. */
  ariaLabel?: string | undefined;
  /** Local class for sizing or positioning the text stack. */
  className?: string | undefined;
  /** Icon-only buttons can hide decorative layered text from assistive technology. */
  isHidden?: boolean | undefined;
};

/**
 * Shared system button with a stable hitbox and moving depth surface.
 *
 * @param props - See {@link ButtonProps}.
 */
export function Button({
  children,
  ariaExpanded,
  ariaLabel,
  ref,
  className,
  disabled = false,
  onClick,
  surfaceClassName,
  type = "button",
}: ButtonProps) {
  return (
    <button
      ref={ref}
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
 * @param props - See {@link ButtonTextProps}.
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
