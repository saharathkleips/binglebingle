import styles from "./SettingsPanel.module.css";

type SettingsPanelProps = {
  /** Parent-owned visibility keeps the nav button and panel in sync. */
  isOpen: boolean;
  /** Called by either the dismiss button or backdrop click. */
  onClose: () => void;
  /** Clears locally persisted game/application state for testing. */
  onClearLocalStorage: () => void;
};

/** Simple settings dialog; intentionally minimal while settings are still taking shape. */
export function SettingsPanel({ isOpen, onClose, onClearLocalStorage }: SettingsPanelProps) {
  if (!isOpen) return null;

  function handleBackdropClick() {
    onClose();
  }

  function handleCardClick(event: React.MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="설정"
        className={styles.card}
        onClick={handleCardClick}
      >
        <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
          ×
        </button>
        <h2 className={styles.title}>설정</h2>
        <button className={styles.dangerButton} onClick={onClearLocalStorage} type="button">
          로컬 저장 삭제
        </button>
      </div>
    </div>
  );
}
