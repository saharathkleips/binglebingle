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
      <h1 className={styles.title}>빙글빙글</h1>
      <button
        className={styles.instructionsButton}
        onClick={onToggleInstructions}
        aria-label="Toggle instructions"
        aria-expanded={isInstructionsOpen}
        data-testid="instructions-toggle"
      >
        ?
      </button>
    </nav>
  );
}
