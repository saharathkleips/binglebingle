import Gear from "../../../gear.svg?react";
import { NavActionButton } from "./NavActionButton";
import styles from "./NavBar.module.css";

type NavBarProps = {
  onToggleInstructions: () => void;
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
    <nav className={styles.navBar} data-testid="nav-bar">
      <div className={styles.navContent}>
        <h1 className={styles.logo} aria-label="빙글빙글">
          <span className={styles.logoText}>ㅂㄱㅂㄱ</span>
        </h1>
        <div className={styles.actions} role="group" aria-label="Game actions">
          <div className={styles.actionCluster}>
            <NavActionButton ariaLabel="Set difficulty to three" testId="difficulty-three-button">
              삼
            </NavActionButton>
            <NavActionButton ariaLabel="Set difficulty to four" testId="difficulty-four-button">
              사
            </NavActionButton>
            <NavActionButton ariaLabel="Set difficulty to five" testId="difficulty-five-button">
              오
            </NavActionButton>
          </div>
          <div className={styles.actionCluster}>
            <NavActionButton
              ariaLabel="Toggle instructions"
              isExpanded={isInstructionsOpen}
              onClick={onToggleInstructions}
              testId="instructions-toggle"
            >
              ?
            </NavActionButton>
            <NavActionButton ariaLabel="Open settings" testId="settings-button">
              <Gear focusable="false" />
            </NavActionButton>
          </div>
        </div>
      </div>
    </nav>
  );
}
