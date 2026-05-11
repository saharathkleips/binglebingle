import { useEffect, useRef } from "react";
import { NavBar } from "../nav-bar/NavBar";
import { BaseTile } from "../tile/BaseTile";
import type { BaseTileTone } from "../tile/BaseTile";
import styles from "./TilePreview.module.css";

const HISTORY_PREVIEW_ROWS = [
  [
    { tile: "ㄱ", tone: "correct" },
    { tile: "ㅏ", tone: "present" },
    { tile: "ㄴ", tone: "absent" },
    { tile: "ㄷ", tone: "correct" },
    { tile: "ㅓ", tone: "present" },
    { tile: "ㄹ", tone: "absent" },
    { tile: "ㅁ", tone: "correct" },
  ],
  [
    { tile: "ㅂ", tone: "present" },
    { tile: "ㅣ", tone: "absent" },
    { tile: "ㅅ", tone: "correct" },
    { tile: "ㅗ", tone: "present" },
    { tile: "ㅇ", tone: "absent" },
    { tile: "ㅜ", tone: "correct" },
    { tile: "ㅈ", tone: "present" },
  ],
  [
    { tile: "ㅊ", tone: "absent" },
    { tile: "ㅡ", tone: "correct" },
    { tile: "ㅋ", tone: "present" },
    { tile: "ㅌ", tone: "absent" },
    { tile: "ㅍ", tone: "correct" },
    { tile: "ㅎ", tone: "present" },
    { tile: "ㅐ", tone: "absent" },
  ],
  [
    { tile: "ㄲ", tone: "correct" },
    { tile: "ㅒ", tone: "correct" },
    { tile: "ㄸ", tone: "correct" },
    { tile: "ㅔ", tone: "correct" },
    { tile: "ㅃ", tone: "correct" },
    { tile: "ㅖ", tone: "correct" },
    { tile: "ㅆ", tone: "correct" },
  ],
] as const satisfies readonly (readonly { tile: string; tone: BaseTileTone }[])[];

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
              {row.map(({ tile, tone }, tileIndex) => (
                <BaseTile tone={tone} key={`${tile}-${tileIndex}`}>
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
