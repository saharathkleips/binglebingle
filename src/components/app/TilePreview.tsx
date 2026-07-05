import { GameProvider } from "../../context/game/GameContext";
import type { GameState } from "../../context/game";
import { character } from "../../lib/character";
import type { Character } from "../../lib/character";
import { CHOSEONG_INDEX, JONGSEONG_INDEX, JUNGSEONG_INDEX } from "../../lib/jamo";
import type { Jamo } from "../../lib/jamo";
import type { CharacterResult } from "../../lib/engine";
import { createWord } from "../../lib/word";
import { HistoryArea } from "../history-area/HistoryArea";
import { NavBar } from "../nav-bar/NavBar";
import { Pool } from "../pool/Pool";
import { SubmissionArea } from "../submission-area/SubmissionArea";
import styles from "./App.module.css";

export type TilePreviewFontOption = {
  id: string;
  label: string;
  fontFamily: string;
  fontWeight: number;
  fontUrl?: string;
};

const DEFAULT_TILE_PREVIEW_FONT_OPTION: TilePreviewFontOption = {
  id: "app-default",
  label: "App default",
  fontFamily: "var(--font-family-tile)",
  fontWeight: 700,
};

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
] as const satisfies readonly (readonly { tile: Jamo; result: CharacterResult }[])[];

const SUBMISSION_PREVIEW_TILES = [
  "ㄱ",
  "ㅏ",
  "ㄴ",
  "ㄷ",
  "ㅓ",
  "ㄹ",
  "ㅁ",
] as const satisfies readonly Jamo[];

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
] as const satisfies readonly Jamo[];

const PREVIEW_TARGET_WORD = createRequiredWord("가나다라마바사");
const PREVIEW_STATE: GameState = {
  targetWord: PREVIEW_TARGET_WORD,
  history: HISTORY_PREVIEW_ROWS.map((row) =>
    row.map(({ tile, result }) => ({ character: createPreviewCharacter(tile), result })),
  ),
  submission: SUBMISSION_PREVIEW_TILES.map((tile, index) => ({
    state: "FILLED",
    tileId: index,
    character: createPreviewCharacter(tile),
  })),
  pool: POOL_PREVIEW_TILES.map((tile, index) => ({
    id: index + SUBMISSION_PREVIEW_TILES.length,
    character: createPreviewCharacter(tile),
  })),
};

export function TilePreview({
  fontOption = DEFAULT_TILE_PREVIEW_FONT_OPTION,
}: {
  fontOption?: TilePreviewFontOption;
}) {
  return (
    <GameProvider initialState={PREVIEW_STATE}>
      {fontOption.fontUrl ? <link rel="stylesheet" href={fontOption.fontUrl} /> : null}
      <style>
        {`:root { --font-family-tile: ${fontOption.fontFamily}; --font-weight-tile: ${fontOption.fontWeight}; }`}
      </style>
      <div className={styles.app} data-testid="tile-preview-frame">
        <div className={styles.gameShell}>
          <NavBar onToggleInstructions={handleNoop} isInstructionsOpen={false} />
          <div className={styles.gameArea}>
            <HistoryArea />
            <div className={styles.gameContent}>
              <SubmissionArea />
              <Pool />
            </div>
          </div>
        </div>
      </div>
    </GameProvider>
  );
}

function createPreviewCharacter(jamo: Jamo): Character {
  if (jamo in JUNGSEONG_INDEX) return requireCharacter(character({ jungseong: jamo }));
  if (jamo in CHOSEONG_INDEX) return requireCharacter(character({ choseong: jamo }));
  if (jamo in JONGSEONG_INDEX) return requireCharacter(character({ jongseong: jamo }));
  throw new Error(`Unsupported preview jamo: ${jamo}`);
}

function requireCharacter(value: Character | null): Character {
  if (value === null) throw new Error("Invalid preview character");
  return value;
}

function createRequiredWord(word: string) {
  const createdWord = createWord(word);
  if (createdWord === null) throw new Error(`Invalid preview target word: ${word}`);
  return createdWord;
}

function handleNoop() {
  return undefined;
}
