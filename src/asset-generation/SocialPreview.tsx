import type { CSSProperties } from "react";
import { character } from "../lib/character";
import type { Character, CompleteCharacter } from "../lib/character";
import type { CharacterResult, EvaluatedCharacter } from "../lib/engine";
import { HistoryCard } from "../components/history-area/HistoryCard";
import { SubmissionSlot } from "../components/submission-area/SubmissionSlot";
import { CharacterTile } from "../components/tile/CharacterTile";
import styles from "./SocialPreview.module.css";

/** Props for the social preview scene. */
export type SocialPreviewProps = {
  /** Output width in CSS pixels. */
  width: number;
  /** Output height in CSS pixels. */
  height: number;
};

const titleCharacters = ["빙", "글", "빙", "글"].map(toCompleteCharacter);
const ctaWords = [
  { result: "PRESENT", characters: ["단", "어"].map(toEvaluatedCharacter("PRESENT")) },
  { result: "CORRECT", characters: ["맞", "히", "자"].map(toEvaluatedCharacter("CORRECT")) },
] as const;

const confettiCharacters = [
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
] as const;

const confettiColors = [
  "var(--color-confetti-jade)",
  "var(--color-confetti-mint)",
  "var(--color-confetti-gold)",
  "var(--color-confetti-yellow)",
  "var(--color-confetti-red)",
  "var(--color-confetti-blossom)",
] as const;

const BACKGROUND_CONFETTI_SEED = 0x3d9a71;
const FOREGROUND_CONFETTI_SEED = 0xc0ffee;
const BACKGROUND_CONFETTI_COUNT = 440;
const FOREGROUND_CONFETTI_COUNT = 110;

type ConfettiParticle = {
  colorIndex: number;
  left: number;
  opacity: number;
  rotation: number;
  size: number;
  text: (typeof confettiCharacters)[number];
  top: number;
};

type ConfettiParticleStyle = CSSProperties & Record<`--confetti-${string}`, string>;

type ConfettiExclusionArea = {
  maximumLeft: number;
  maximumTop: number;
  minimumLeft: number;
  minimumTop: number;
};

const backgroundConfettiParticles = generateConfettiParticles({
  count: BACKGROUND_CONFETTI_COUNT,
  maximumOpacity: 0.5,
  maximumSize: 42,
  minimumOpacity: 0.18,
  minimumSize: 14,
  seed: BACKGROUND_CONFETTI_SEED,
});
const foregroundConfettiParticles = generateConfettiParticles({
  count: FOREGROUND_CONFETTI_COUNT,
  excludedAreas: [
    // Keep full-color foreground jamo off the main content. Background confetti
    // still sits behind this area, but foreground glyphs should not cross text or tiles.
    { maximumLeft: 84, maximumTop: 96, minimumLeft: 16, minimumTop: 6 },
  ],
  maximumOpacity: 1,
  maximumSize: 58,
  minimumOpacity: 1,
  minimumSize: 30,
  seed: FOREGROUND_CONFETTI_SEED,
});

/** Renders the Open Graph / social card artwork. */
export function SocialPreview({ width, height }: SocialPreviewProps) {
  return (
    <main
      aria-label="Generated social preview"
      className={styles.scene}
      data-asset-preview="social-preview"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className={styles.backgroundConfetti} aria-hidden="true">
        {backgroundConfettiParticles.map((particle, index) => (
          <span
            key={`${particle.text}-${particle.left}-${particle.top}-${index}`}
            className={styles.confettiParticle}
            style={getConfettiParticleStyle(particle)}
          >
            {particle.text}
          </span>
        ))}
      </div>
      <section className={styles.content} aria-label="빙글빙글 social preview content">
        <div className={styles.title} aria-label="빙글빙글">
          {titleCharacters.map((titleCharacter, index) => (
            <CharacterTile
              key={`${titleCharacter.choseong}-${titleCharacter.jungseong}-${index}`}
              character={titleCharacter}
              className={styles.titleTile}
              label="빙글빙글 title tile"
            />
          ))}
        </div>

        <p className={styles.description}>매일 한 번 단어 추리 게임</p>

        <div className={styles.callToAction} aria-label="단어 맞히자">
          <div className={styles.historyWord} data-result={ctaWords[0].result}>
            {ctaWords[0].characters.map((evaluated) => (
              <HistoryCard key={getEvaluatedCharacterKey(evaluated)} evaluated={evaluated} />
            ))}
          </div>
          <SubmissionSlot
            slot={{ state: "EMPTY" }}
            slotIndex={0}
            isInteractionDisabled
            onTap={() => {}}
            onDropOnSlot={() => {}}
          />
          <div className={styles.historyWord} data-result={ctaWords[1].result}>
            {ctaWords[1].characters.map((evaluated) => (
              <HistoryCard key={getEvaluatedCharacterKey(evaluated)} evaluated={evaluated} />
            ))}
          </div>
        </div>
      </section>
      <div className={styles.foregroundConfetti} aria-hidden="true">
        {foregroundConfettiParticles.map((particle, index) => (
          <span
            key={`${particle.text}-${particle.left}-${particle.top}-${index}`}
            className={styles.confettiParticle}
            style={getConfettiParticleStyle(particle)}
          >
            {particle.text}
          </span>
        ))}
      </div>
    </main>
  );
}

function generateConfettiParticles({
  count,
  excludedAreas = [],
  maximumOpacity,
  maximumSize,
  minimumOpacity,
  minimumSize,
  seed,
}: {
  count: number;
  excludedAreas?: readonly ConfettiExclusionArea[];
  maximumOpacity: number;
  maximumSize: number;
  minimumOpacity: number;
  minimumSize: number;
  seed: number;
}): ConfettiParticle[] {
  const random = createSeededRandom(seed);
  return Array.from({ length: count }, () =>
    createConfettiParticle({
      excludedAreas,
      maximumOpacity,
      maximumSize,
      minimumOpacity,
      minimumSize,
      random,
    }),
  );
}

function createConfettiParticle({
  excludedAreas,
  maximumOpacity,
  maximumSize,
  minimumOpacity,
  minimumSize,
  random,
}: {
  excludedAreas: readonly ConfettiExclusionArea[];
  maximumOpacity: number;
  maximumSize: number;
  minimumOpacity: number;
  minimumSize: number;
  random: () => number;
}): ConfettiParticle {
  const position = getConfettiPosition(random, excludedAreas);
  return {
    ...position,
    colorIndex: randomInteger(random, 0, confettiColors.length),
    opacity: randomBetween(random, minimumOpacity, maximumOpacity),
    rotation: randomBetween(random, -28, 28),
    size: randomBetween(random, minimumSize, maximumSize),
    text: randomItem(random, confettiCharacters),
  };
}

function getConfettiPosition(
  random: () => number,
  excludedAreas: readonly ConfettiExclusionArea[],
): Pick<ConfettiParticle, "left" | "top"> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const position = {
      left: randomBetween(random, -6, 106),
      top: randomBetween(random, -8, 108),
    };
    if (!isConfettiPositionExcluded(position, excludedAreas)) return position;
  }

  return { left: randomBetween(random, -6, 106), top: randomBetween(random, -8, 108) };
}

function isConfettiPositionExcluded(
  position: Pick<ConfettiParticle, "left" | "top">,
  excludedAreas: readonly ConfettiExclusionArea[],
): boolean {
  return excludedAreas.some(
    (area) =>
      position.left >= area.minimumLeft &&
      position.left <= area.maximumLeft &&
      position.top >= area.minimumTop &&
      position.top <= area.maximumTop,
  );
}

function getConfettiParticleStyle({
  colorIndex,
  left,
  opacity,
  rotation,
  size,
  top,
}: ConfettiParticle): ConfettiParticleStyle {
  return {
    "--confetti-color": confettiColors[colorIndex % confettiColors.length]!,
    "--confetti-left": `${left}%`,
    "--confetti-opacity": String(opacity),
    "--confetti-rotation": `${rotation}deg`,
    "--confetti-size": `${size}px`,
    "--confetti-top": `${top}%`,
  };
}

function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(random: () => number, minimum: number, maximum: number): number {
  return minimum + random() * (maximum - minimum);
}

function randomInteger(random: () => number, minimum: number, maximumExclusive: number): number {
  return Math.floor(randomBetween(random, minimum, maximumExclusive));
}

function randomItem<const Item>(random: () => number, items: readonly Item[]): Item {
  return items[randomInteger(random, 0, items.length)]!;
}

function toCompleteCharacter(syllable: string): CompleteCharacter {
  const parsedCharacter = character(syllable);
  if (parsedCharacter === null) throw new Error(`Invalid social preview syllable: ${syllable}`);
  return parsedCharacter;
}

function toEvaluatedCharacter(result: CharacterResult) {
  return (syllable: string): EvaluatedCharacter => ({
    character: toCompleteCharacter(syllable),
    result,
  });
}

function getEvaluatedCharacterKey(evaluated: EvaluatedCharacter): string {
  return `${evaluated.result}-${evaluated.character?.kind}-${evaluated.character ? characterToKey(evaluated.character) : "empty"}`;
}

function characterToKey(value: Character): string {
  switch (value.kind) {
    case "EMPTY":
      return "empty";
    case "CHOSEONG_ONLY":
      return value.choseong;
    case "JUNGSEONG_ONLY":
      return value.jungseong;
    case "JONGSEONG_ONLY":
      return value.jongseong;
    case "OPEN_SYLLABLE":
      return `${value.choseong}-${value.jungseong}`;
    case "FULL_SYLLABLE":
      return `${value.choseong}-${value.jungseong}-${value.jongseong}`;
  }
}
