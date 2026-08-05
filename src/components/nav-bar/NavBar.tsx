import Gear from "./gear.svg?react";
import { Logo } from "./Logo";
import { NavActionButton } from "./NavActionButton";
import type { Difficulty } from "../../lib/puzzle";
import styles from "./NavBar.module.css";

/** Props for the top navigation bar. */
type NavBarProps = {
  /** Called when the user clicks the instructions toggle. */
  onToggleInstructions: () => void;
  /** Drives aria-expanded on the instructions button; NavBar stays props-only. */
  isInstructionsOpen: boolean;
  /** Called when the user clicks the settings toggle. */
  onToggleSettings?: (() => void) | undefined;
  /** Drives aria-expanded on the settings button. */
  isSettingsOpen?: boolean | undefined;
  /** Currently selected word length difficulty. */
  activeDifficulty?: Difficulty | undefined;
  /** Called when the user selects a word length difficulty. */
  onSelectDifficulty?: ((difficulty: Difficulty) => void) | undefined;
};

/**
 * Top navigation bar rendered on every screen.
 */
export function NavBar({
  onToggleInstructions,
  isInstructionsOpen,
  onToggleSettings,
  isSettingsOpen,
  activeDifficulty,
  onSelectDifficulty,
}: NavBarProps) {
  return (
    <nav className={styles.navBar} aria-label="주요 메뉴">
      <div className={styles.navContent}>
        <Logo />
        <div className={styles.actions} role="group" aria-label="게임 메뉴">
          <div className={styles.actionCluster}>
            <NavActionButton
              ariaLabel="3글자 난이도로 설정"
              isPressed={activeDifficulty === 3}
              onClick={() => onSelectDifficulty?.(3)}
              label="삼"
            />
            <NavActionButton
              ariaLabel="4글자 난이도로 설정"
              isPressed={activeDifficulty === 4}
              onClick={() => onSelectDifficulty?.(4)}
              label="사"
            />
            <NavActionButton
              ariaLabel="5글자 난이도로 설정"
              isPressed={activeDifficulty === 5}
              onClick={() => onSelectDifficulty?.(5)}
              label="오"
            />
          </div>
          <div className={styles.actionCluster}>
            <NavActionButton
              ariaLabel="게임 방법"
              isExpanded={isInstructionsOpen}
              onClick={onToggleInstructions}
              label="?"
            />
            <NavActionButton
              ariaLabel="설정 열기"
              isExpanded={isSettingsOpen}
              onClick={onToggleSettings}
              icon={<Gear focusable="false" />}
              kind="icon"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
