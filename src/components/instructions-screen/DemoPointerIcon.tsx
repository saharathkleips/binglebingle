import styles from "./InstructionsScreen.module.css";

type DemoPointerIconProps = {
  /** Class applied to the SVG element for sizing/hotspot positioning. */
  className: string | undefined;
};

const POINTER_PATH =
  "M10.25 4.75c.55 0 1 .45 1 1v11.5h2V10.5a1 1 0 1 1 2 0v7h2v-4.25a1 1 0 1 1 2 0v4.25h2V14.5a1 1 0 1 1 2 0v8.75a4.25 4.25 0 0 1-4.25 4.25h-7.17a4.25 4.25 0 0 1-3-1.24l-7.3-7.3a1.03 1.03 0 0 1 1.46-1.46l4.51 4.5h1.75V5.75c0-.55.45-1 1-1Z";

export function DemoPointerIcon({ className }: DemoPointerIconProps) {
  return (
    <svg className={className} viewBox="-4 -4 40 40" focusable="false">
      <path d={POINTER_PATH} className={styles.demoPointerStroke} />
      <path d={POINTER_PATH} className={styles.demoPointerPalm} />
    </svg>
  );
}
