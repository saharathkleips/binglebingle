import { useEffect, useRef } from "react";
import { NavBar } from "../nav-bar/NavBar";
import type { CharacterResult } from "../../lib/engine";
import { BaseTile } from "../tile/BaseTile";
import styles from "./TilePreview.module.css";

const HISTORY_PREVIEW_ROWS = [
  [
    { tile: "ㄱ", result: "CORRECT" },
    { tile: "ㅏ", result: "PRESENT" },
    { tile: "ㄴ", result: "ABSENT" },
    { tile: "ㄷ", result: "CORRECT" },
    { tile: "ㅓ", result: "PRESENT" },
    { tile: "ㄹ", result: "ABSENT" },
    { tile: "ㅁ", result: "CORRECT" },
  ],
  [
    { tile: "ㅂ", result: "PRESENT" },
    { tile: "ㅣ", result: "ABSENT" },
    { tile: "ㅅ", result: "CORRECT" },
    { tile: "ㅗ", result: "PRESENT" },
    { tile: "ㅇ", result: "ABSENT" },
    { tile: "ㅜ", result: "CORRECT" },
    { tile: "ㅈ", result: "PRESENT" },
  ],
  [
    { tile: "ㅊ", result: "ABSENT" },
    { tile: "ㅡ", result: "CORRECT" },
    { tile: "ㅋ", result: "PRESENT" },
    { tile: "ㅌ", result: "ABSENT" },
    { tile: "ㅍ", result: "CORRECT" },
    { tile: "ㅎ", result: "PRESENT" },
    { tile: "ㅐ", result: "ABSENT" },
  ],
  [
    { tile: "ㄲ", result: "CORRECT" },
    { tile: "ㅒ", result: "CORRECT" },
    { tile: "ㄸ", result: "CORRECT" },
    { tile: "ㅔ", result: "CORRECT" },
    { tile: "ㅃ", result: "CORRECT" },
    { tile: "ㅖ", result: "CORRECT" },
    { tile: "ㅆ", result: "CORRECT" },
  ],
] as const satisfies readonly (readonly { tile: string; result: CharacterResult }[])[];

const SUBMISSION_PREVIEW_TILES = ["ㄱ", "ㅏ", "ㄴ", "ㄷ", "ㅓ", "ㄹ", "ㅁ"] as const;

const POOL_PREVIEW_TILES = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
  "ㄲ",
  "ㄸ",
  "ㅃ",
  "ㅆ",
  "ㅉ",
  "ㅏ",
  "ㅑ",
  "ㅓ",
  "ㅕ",
  "ㅗ",
  "ㅛ",
  "ㅜ",
  "ㅠ",
  "ㅡ",
  "ㅣ",
  "ㅐ",
  "ㅒ",
  "ㅔ",
  "ㅖ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅢ",
  "ㄳ",
  "ㄵ",
] as const;

export function TilePreview() {
  const historyAreaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (historyAreaRef.current !== null) {
      historyAreaRef.current.scrollTop = historyAreaRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className={styles.preview} data-testid="tile-preview-frame">
      <NavBar onToggleInstructions={handleNoop} isInstructionsOpen={false} />
      <main className={styles.gameArea}>
        <section
          ref={historyAreaRef}
          className={styles.historyArea}
          aria-label="Preview history area"
        >
          {HISTORY_PREVIEW_ROWS.map((row, rowIndex) => (
            <div className={styles.historyRow} key={`history-${rowIndex}`}>
              {row.map(({ tile, result }, tileIndex) => (
                <BaseTile result={result} key={`${tile}-${tileIndex}`}>
                  {tile}
                </BaseTile>
              ))}
            </div>
          ))}
        </section>

        <div className={styles.gameContent}>
          <section className={styles.submissionArea} aria-label="Preview submission area">
            <div className={styles.submissionSlots}>
              {SUBMISSION_PREVIEW_TILES.map((tile, index) => (
                <div className={styles.submissionSlot} key={`${tile}-${index}`}>
                  <BaseTile>{tile}</BaseTile>
                </div>
              ))}
            </div>
            <button className={styles.submissionButton} type="button">
              Submit
            </button>
          </section>

          <section className={styles.pool} aria-label="Preview pool with maximum tile count">
            {POOL_PREVIEW_TILES.map((tile, index) => (
              <div className={styles.poolCell} key={`${tile}-${index}`}>
                <BaseTile element="button" isInteractive>
                  {tile}
                </BaseTile>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}

function handleNoop() {
  return undefined;
}
