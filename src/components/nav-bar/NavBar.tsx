import Gear from "./gear.svg?react";
import { NavActionButton } from "./NavActionButton";
import styles from "./NavBar.module.css";

type NavBarProps = {
  onToggleInstructions: () => void;
  /** Drives aria-expanded on the instructions button; NavBar stays props-only. */
  isInstructionsOpen: boolean;
};

/**
 * Top navigation bar rendered on every screen.
 *
 * @param onToggleInstructions - Called when the user clicks the "?" button.
 * @param isInstructionsOpen - Whether the InstructionsScreen overlay is currently open.
 * @returns The rendered NavBar element.
 */
export function NavBar({ onToggleInstructions, isInstructionsOpen }: NavBarProps) {
  return (
    <nav className={styles.navBar} aria-label="Primary navigation">
      <div className={styles.navContent}>
        <h1 className={styles.logo} aria-label="빙글빙글">
          <span className={styles.logoText}>ㅂㄱㅂㄱ</span>
        </h1>
        <div className={styles.actions} role="group" aria-label="Game actions">
          <div className={styles.actionCluster}>
            <NavActionButton ariaLabel="Set difficulty to three" label="삼" />
            <NavActionButton ariaLabel="Set difficulty to four" label="사" />
            <NavActionButton ariaLabel="Set difficulty to five" label="오" />
          </div>
          <div className={styles.actionCluster}>
            <NavActionButton
              ariaLabel="Toggle instructions"
              isExpanded={isInstructionsOpen}
              onClick={onToggleInstructions}
              label="?"
            />
            <NavActionButton
              ariaLabel="Open settings"
              icon={<Gear focusable="false" />}
              kind="icon"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
