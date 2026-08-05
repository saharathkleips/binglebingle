import { type ReactNode } from "react";
import { Button, ButtonText } from "../button/Button";
import styles from "./NavActionButton.module.css";

/** Props shared by nav action button variants. */
type NavActionButtonBaseProps = {
  /** Accessible action name for the circular nav control. */
  ariaLabel: string;
  /** Forwarded to aria-expanded for controls that open overlays. */
  isExpanded?: boolean | undefined;
  /** Forwarded to aria-pressed for selected/toggle controls. */
  isPressed?: boolean | undefined;
  /** Called when the user activates the nav control. */
  onClick?: (() => void) | undefined;
};

/** Props for text and icon nav actions. */
type NavActionButtonProps = NavActionButtonBaseProps &
  (
    | {
        /** Renders a layered text label; defaults to text. */
        kind?: "text";
        /** Short visible label rendered in the button face. */
        label: string;
      }
    | {
        /** Renders an SVG/icon node instead of text. */
        kind: "icon";
        /** Decorative icon node; the accessible name comes from `ariaLabel`. */
        icon: ReactNode;
      }
  );

/**
 * Circular nav action using the same surface and label treatment as the submission button.
 *
 * @param props - See {@link NavActionButtonProps}.
 */
export function NavActionButton(props: NavActionButtonProps) {
  return (
    <Button
      className={styles.button}
      surfaceClassName={styles.surface}
      onClick={props.onClick}
      ariaLabel={props.ariaLabel}
      ariaExpanded={props.isExpanded}
      ariaPressed={props.isPressed}
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
