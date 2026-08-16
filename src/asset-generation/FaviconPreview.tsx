import { CharacterTile } from "../components/tile/CharacterTile";
import styles from "./FaviconPreview.module.css";

/** Props for the favicon preview scene. */
export type FaviconPreviewProps = {
  /** Square output size in CSS pixels. */
  size: number;
};

/** Renders the favicon artwork using the same character tile path as the app. */
export function FaviconPreview({ size }: FaviconPreviewProps) {
  return (
    <main
      aria-label="Generated favicon preview"
      className={styles.scene}
      data-asset-preview="favicon"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <CharacterTile
        character={{ kind: "CHOSEONG_ONLY", choseong: "ㅂ" }}
        className={styles.tile}
        label="빙글빙글 favicon tile"
      />
    </main>
  );
}
