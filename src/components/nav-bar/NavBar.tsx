import Gear from "./gear.svg?react";
import { Logo } from "./Logo";
import { NavActionButton } from "./NavActionButton";
import styles from "./NavBar.module.css";

/** Props for the top navigation bar. */
type NavBarProps = {
  /** Called when the user clicks the instructions toggle. */
  onToggleInstructions: () => void;
  /** Drives aria-expanded on the instructions button; NavBar stays props-only. */
  isInstructionsOpen: boolean;
};

/**
 * Top navigation bar rendered on every screen.
 */
export function NavBar({ onToggleInstructions, isInstructionsOpen }: NavBarProps) {
  return (
    <nav className={styles.navBar} aria-label="주요 메뉴">
      <div className={styles.navContent}>
        <Logo />
        <div className={styles.actions} role="group" aria-label="게임 메뉴">
          <div className={styles.actionCluster}>
            <NavActionButton ariaLabel="3글자 난이도로 설정" label="삼" />
            <NavActionButton ariaLabel="4글자 난이도로 설정" label="사" />
            <NavActionButton ariaLabel="5글자 난이도로 설정" label="오" />
          </div>
          <div className={styles.actionCluster}>
            <NavActionButton
              ariaLabel="게임 방법"
              isExpanded={isInstructionsOpen}
              onClick={onToggleInstructions}
              label="?"
            />
            <NavActionButton ariaLabel="설정 열기" icon={<Gear focusable="false" />} kind="icon" />
          </div>
        </div>
      </div>
    </nav>
  );
}
