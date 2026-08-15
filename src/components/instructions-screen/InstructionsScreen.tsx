import { useLayoutEffect, useRef, useState } from "react";
import type { Character } from "../../lib/character";
import type { GameState } from "../../context/game";
import { GameProvider } from "../../context/game/GameContext";
import { useGame } from "../../context/game/GameContext";
import { recordTileSnapBack } from "../../lib/animation/snap-back-animations";
import { animateComposePulse } from "../../lib/animation/tile-animations";
import { animatePickUp } from "../../lib/animation/drag-animations";
import { gsap, useGSAP } from "../../lib/animation/register";
import {
  dataAttributeSelector,
  DATA_SLOT_INDEX_ATTRIBUTE,
  DATA_TILE_ANIMATION_LAYER_ATTRIBUTE,
  DATA_TILE_ID_ATTRIBUTE,
} from "../../lib/dom-data-attributes";
import { createWord } from "../../lib/word";
import { Pool } from "../pool/Pool";
import { SubmissionArea } from "../submission-area/SubmissionArea";
import type { EvaluatedCharacter } from "../../lib/engine";
import { HistoryCard } from "../history-area/HistoryCard";
import { DemoPointerIcon } from "./DemoPointerIcon";
import styles from "./InstructionsScreen.module.css";

type InstructionsScreenProps = {
  /** Parent-owned visibility keeps the NavBar button and overlay in sync. */
  isOpen: boolean;
  /** Called by either the dismiss button or backdrop click. */
  onClose: () => void;
};

const EXAMPLE_CHARACTERS = {
  ㄱ: { kind: "CHOSEONG_ONLY", choseong: "ㄱ" },
  ㄹ: { kind: "CHOSEONG_ONLY", choseong: "ㄹ" },
  ㅇ: { kind: "CHOSEONG_ONLY", choseong: "ㅇ" },
  ㅎ: { kind: "CHOSEONG_ONLY", choseong: "ㅎ" },
  ㅏ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅏ" },
  ㅗ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅗ" },
  ㅜ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅜ" },
  ㅓ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅓ" },
  ㅡ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅡ" },
  ㅘ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅘ" },
  ㅙ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅙ" },
  ㅣ: { kind: "JUNGSEONG_ONLY", jungseong: "ㅣ" },
  아: { kind: "OPEN_SYLLABLE", choseong: "ㅇ", jungseong: "ㅏ" },
  하: { kind: "OPEN_SYLLABLE", choseong: "ㅎ", jungseong: "ㅏ" },
  해: { kind: "OPEN_SYLLABLE", choseong: "ㅎ", jungseong: "ㅐ" },
  빙: { kind: "FULL_SYLLABLE", choseong: "ㅂ", jungseong: "ㅣ", jongseong: "ㅇ" },
  글: { kind: "FULL_SYLLABLE", choseong: "ㄱ", jungseong: "ㅡ", jongseong: "ㄹ" },
  가: { kind: "OPEN_SYLLABLE", choseong: "ㄱ", jungseong: "ㅏ" },
  나: { kind: "OPEN_SYLLABLE", choseong: "ㄴ", jungseong: "ㅏ" },
  다: { kind: "OPEN_SYLLABLE", choseong: "ㄷ", jungseong: "ㅏ" },
  라: { kind: "OPEN_SYLLABLE", choseong: "ㄹ", jungseong: "ㅏ" },
  왜: { kind: "OPEN_SYLLABLE", choseong: "ㅇ", jungseong: "ㅙ" },
  리: { kind: "OPEN_SYLLABLE", choseong: "ㄹ", jungseong: "ㅣ" },
} satisfies Record<string, Character>;

const DEMO_TARGET_WORD = createWord("왜가리");
if (DEMO_TARGET_WORD === null) throw new Error("Instruction demo word must be valid Korean.");

const DEMO_ANIMATION_TIME_SCALE = 1;
const DEMO_POINTER_TARGET_OFFSET_RATIO = 0.3;
const DEMO_ROTATION_TOTAL_DURATION = 1.2;
const DEMO_INITIAL_ORIENTATION_DELAY = 0.6;
const DEMO_DRAG_DURATION = 0.75;
const DEMO_DROP_COMMIT_DELAY = 0.03;
const DEMO_AFTER_DROP_PAUSE = 0.25;
const DEMO_LOOP_RETURN_DURATION = 0.45;
const DEMO_LOOP_END_PAUSE = 0.7;

const COMPOSITION_DEMO_INITIAL_STATE = {
  targetWord: DEMO_TARGET_WORD,
  submission: [{ state: "EMPTY" }, { state: "EMPTY" }, { state: "EMPTY" }],
  history: [],
  pool: [
    { id: 1000, character: EXAMPLE_CHARACTERS.ㅎ },
    { id: 1001, character: EXAMPLE_CHARACTERS.ㅏ },
    { id: 1002, character: EXAMPLE_CHARACTERS.ㅣ },
  ],
} satisfies GameState;

const ROTATION_DEMO_INITIAL_STATE = {
  targetWord: DEMO_TARGET_WORD,
  submission: [{ state: "EMPTY" }, { state: "EMPTY" }, { state: "EMPTY" }],
  history: [],
  pool: [{ id: 2000, character: EXAMPLE_CHARACTERS.ㅏ }],
} satisfies GameState;

const GUESS_DEMO_INITIAL_STATE = {
  targetWord: DEMO_TARGET_WORD,
  submission: [{ state: "EMPTY" }, { state: "EMPTY" }, { state: "EMPTY" }],
  history: [],
  pool: [
    { id: 3000, character: EXAMPLE_CHARACTERS.빙 },
    { id: 3001, character: EXAMPLE_CHARACTERS.글 },
  ],
} satisfies GameState;

/**
 * Full-screen overlay explaining the game mechanic via a worked example.
 * Parent state controls whether the overlay is shown.
 */
export function InstructionsScreen({ isOpen, onClose }: InstructionsScreenProps) {
  if (!isOpen) return null;

  function handleBackdropClick() {
    onClose();
  }

  function handleCardClick(event: React.MouseEvent) {
    // Prevent backdrop handler from firing when clicking inside the card
    event.stopPropagation();
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick} data-instructions-backdrop>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="게임 방법"
        className={styles.card}
        onClick={handleCardClick}
      >
        <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
          ×
        </button>

        <div className={styles.content}>
          <header className={styles.header}>
            {/* How to play Binglebingle. */}
            <p className={styles.lede}>빙글빙글 하는 법</p>
            {/* Rotate and combine jamo to make characters and guess the hidden word. */}
            <p className={styles.label}>자모를 돌리고 합쳐, 모든 조각으로 숨은 낱말을 맞혀요!</p>
          </header>

          <section className={styles.instructionSection} aria-label="글자 만들기">
            <div className={styles.gestureDemo}>
              <span className={styles.visuallyHidden}>ㅇ ㄱ ㄹ ㅏ ㅜ ㅓ ㅗ ㅘ ㅙ 왜 하 해 ㅎ</span>
              <GestureDemoCard title="끌어 합치기 · 톡 눌러 나누기">
                <CompositionDemoStage />
              </GestureDemoCard>
              <GestureDemoCard title="톡 눌러 돌리기">
                <RotationDemoStage />
              </GestureDemoCard>
            </div>
          </section>

          <section className={styles.instructionSection} aria-label="추측 제출">
            <div className={styles.submissionInstructionGrid}>
              <div className={styles.submissionInstructionColumn}>
                <p className={styles.label}>칸에 끌어다 놓고 추측해요.</p>
                <span className={styles.visuallyHidden} aria-label="빈칸" />
                <GuessDemoStage />
              </div>
              <div className={styles.submissionInstructionColumn}>
                <p className={styles.label}>색으로 단서를 확인해요.</p>
                <ClueLegend />
              </div>
            </div>
          </section>

          <section className={styles.instructionSection} aria-label="팁">
            <p className={styles.label}>알아두면 좋아요.</p>
            <ul className={styles.tipList}>
              <li>빈칸이 있어도 제출할 수 있어요.</li>
              <li>진짜 낱말이 아니어도 괜찮아요.</li>
              <li>몇 번이든 추측할 수 있어요.</li>
              <li>정답은 사전 낱말이에요.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function GestureDemoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.gestureDemoCard}>
      <p className={styles.gestureDemoTitle}>{title}</p>
      {children}
    </div>
  );
}

function CompositionDemoStage() {
  const [animationCycle, setAnimationCycle] = useState(0);

  return (
    <div className={styles.demoStage} aria-label="합치고 나누기 애니메이션">
      <GameProvider key={animationCycle} initialState={COMPOSITION_DEMO_INITIAL_STATE}>
        <CompositionDemoAnimation onComplete={() => setAnimationCycle((cycle) => cycle + 1)} />
      </GameProvider>
    </div>
  );
}

function RotationDemoStage() {
  const [animationCycle, setAnimationCycle] = useState(0);

  return (
    <div className={styles.demoStage} aria-label="돌리기 애니메이션">
      <GameProvider key={animationCycle} initialState={ROTATION_DEMO_INITIAL_STATE}>
        <RotationDemoAnimation onComplete={() => setAnimationCycle((cycle) => cycle + 1)} />
      </GameProvider>
    </div>
  );
}

function CompositionDemoAnimation({ onComplete }: { onComplete: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLSpanElement>(null);
  const { dispatch } = useGame();

  useGSAP(
    () => {
      if (stageRef.current === null || pointerRef.current === null) return;
      const stageElement = stageRef.current;
      const pointerElement = pointerRef.current;
      setPointerOverTile(stageElement, pointerElement, 1000);

      const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete });
      timeline.timeScale(DEMO_ANIMATION_TIME_SCALE);
      timeline.to({}, { duration: DEMO_INITIAL_ORIENTATION_DELAY });
      dragTile(timeline, stageElement, pointerElement, 1001, 1000, () => {
        dispatch({ type: "CHARACTER_COMPOSE", payload: { targetId: 1000, incomingId: 1001 } });
        pulseTile(stageElement, 1000);
      });
      dragTile(timeline, stageElement, pointerElement, 1002, 1000, () => {
        dispatch({ type: "CHARACTER_COMPOSE", payload: { targetId: 1000, incomingId: 1002 } });
        pulseTile(stageElement, 1000);
      });
      tapTile(timeline, stageElement, pointerElement, 1000, () => clickTile(stageElement, 1000));
      tapTile(timeline, stageElement, pointerElement, 1000, () => clickTile(stageElement, 1000));
      movePointerToTile(timeline, stageElement, pointerElement, 1000, DEMO_LOOP_RETURN_DURATION);
      timeline.to({}, { duration: DEMO_LOOP_END_PAUSE });

      return () => timeline.kill();
    },
    { scope: stageRef },
  );

  return <DemoPoolShell stageRef={stageRef} pointerRef={pointerRef} />;
}

function RotationDemoAnimation({ onComplete }: { onComplete: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (stageRef.current === null || pointerRef.current === null) return;
      const stageElement = stageRef.current;
      const pointerElement = pointerRef.current;
      setPointerOverTile(stageElement, pointerElement, 2000);

      const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete });
      timeline.timeScale(DEMO_ANIMATION_TIME_SCALE);
      timeline.to({}, { duration: DEMO_INITIAL_ORIENTATION_DELAY });
      rotateTile(timeline, stageElement, pointerElement, 2000, 4, DEMO_ROTATION_TOTAL_DURATION);
      movePointerToTile(timeline, stageElement, pointerElement, 2000, DEMO_LOOP_RETURN_DURATION);
      timeline.to({}, { duration: DEMO_LOOP_END_PAUSE });

      return () => timeline.kill();
    },
    { scope: stageRef },
  );

  return <DemoPoolShell stageRef={stageRef} pointerRef={pointerRef} />;
}

function GuessDemoStage() {
  const [animationCycle, setAnimationCycle] = useState(0);

  return (
    <div
      className={`${styles.demoStage} ${styles.guessDemoStage}`}
      aria-label="추측 만들기 애니메이션"
    >
      <GameProvider key={animationCycle} initialState={GUESS_DEMO_INITIAL_STATE}>
        <GuessDemoAnimation onComplete={() => setAnimationCycle((cycle) => cycle + 1)} />
      </GameProvider>
    </div>
  );
}

function GuessDemoAnimation({ onComplete }: { onComplete: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLSpanElement>(null);
  const { dispatch } = useGame();

  useGSAP(
    () => {
      if (stageRef.current === null || pointerRef.current === null) return;
      const stageElement = stageRef.current;
      const pointerElement = pointerRef.current;
      setPointerOverTile(stageElement, pointerElement, 3000);

      const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete });
      timeline.timeScale(DEMO_ANIMATION_TIME_SCALE);
      timeline.to({}, { duration: DEMO_INITIAL_ORIENTATION_DELAY });
      dragTileToSlot(timeline, stageElement, pointerElement, 3000, 0, () => {
        dispatch({ type: "SUBMISSION_SLOT_INSERT", payload: { tileId: 3000, slotIndex: 0 } });
      });
      dragTileToSlot(timeline, stageElement, pointerElement, 3001, 2, () => {
        dispatch({ type: "SUBMISSION_SLOT_INSERT", payload: { tileId: 3001, slotIndex: 2 } });
      });
      timeline.to({}, { duration: DEMO_LOOP_END_PAUSE });
      tapTile(timeline, stageElement, pointerElement, 3000, () => clickTile(stageElement, 3000));
      tapTile(timeline, stageElement, pointerElement, 3001, () => clickTile(stageElement, 3001));
      movePointerToTile(timeline, stageElement, pointerElement, 3000, DEMO_LOOP_RETURN_DURATION);
      timeline.to({}, { duration: DEMO_LOOP_END_PAUSE });

      return () => timeline.kill();
    },
    { scope: stageRef },
  );

  return <DemoPoolShell stageRef={stageRef} pointerRef={pointerRef} hasSubmissionArea />;
}

function DemoPoolShell({
  stageRef,
  pointerRef,
  hasSubmissionArea = false,
}: {
  stageRef: React.RefObject<HTMLDivElement | null>;
  pointerRef: React.RefObject<HTMLSpanElement | null>;
  hasSubmissionArea?: boolean;
}) {
  useLayoutEffect(() => {
    const stageElement = stageRef.current;
    if (stageElement === null) return;

    stageElement.querySelectorAll("button").forEach((button) => {
      button.tabIndex = -1;
      button.setAttribute("aria-hidden", "true");
    });
  });

  return (
    <div
      className={styles.demoPoolShell}
      ref={stageRef}
      {...{ [DATA_TILE_ANIMATION_LAYER_ATTRIBUTE]: true }}
    >
      {hasSubmissionArea ? <SubmissionArea isSubmitVisible={false} /> : null}
      <Pool />
      <DemoPointer pointerRef={pointerRef} />
    </div>
  );
}

function DemoPointer({ pointerRef }: { pointerRef: React.RefObject<HTMLSpanElement | null> }) {
  return (
    <span className={styles.demoPointer} ref={pointerRef} aria-hidden="true">
      <DemoPointerIcon className={styles.demoPointerIcon} />
    </span>
  );
}

function setPointerOverTile(
  stageElement: HTMLElement,
  pointerElement: HTMLElement,
  tileId: number,
) {
  const tileElement = getDemoTile(stageElement, tileId);
  if (tileElement !== null) gsap.set(pointerElement, getPointerPosition(stageElement, tileElement));
}

function movePointerToTile(
  timeline: gsap.core.Timeline,
  stageElement: HTMLElement,
  pointerElement: HTMLElement,
  tileId: number,
  duration: number,
) {
  timeline.add(() => {
    const tileElement = getDemoTile(stageElement, tileId);
    if (tileElement === null) return;

    gsap.to(pointerElement, {
      ...getPointerPosition(stageElement, tileElement),
      duration,
      ease: "power2.inOut",
    });
  });
  timeline.to({}, { duration });
}

function dragTile(
  timeline: gsap.core.Timeline,
  stageElement: HTMLElement,
  pointerElement: HTMLElement,
  sourceTileId: number,
  targetTileId: number,
  onDrop: () => void,
) {
  dragTileToTarget(
    timeline,
    stageElement,
    pointerElement,
    sourceTileId,
    () => getDemoTile(stageElement, targetTileId),
    onDrop,
  );
}

function dragTileToSlot(
  timeline: gsap.core.Timeline,
  stageElement: HTMLElement,
  pointerElement: HTMLElement,
  sourceTileId: number,
  slotIndex: number,
  onDrop: () => void,
) {
  dragTileToTarget(
    timeline,
    stageElement,
    pointerElement,
    sourceTileId,
    () => getDemoSlot(stageElement, slotIndex),
    onDrop,
    {
      onBeforeDrop: (sourceElement) => {
        recordTileSnapBack(sourceTileId, sourceElement, { shouldLiftOnArrival: true });
      },
    },
  );
}

function dragTileToTarget(
  timeline: gsap.core.Timeline,
  stageElement: HTMLElement,
  pointerElement: HTMLElement,
  sourceTileId: number,
  getTargetElement: () => HTMLElement | null,
  onDrop: () => void,
  options: { onBeforeDrop?: (sourceElement: HTMLElement) => void } = {},
) {
  movePointerToTile(timeline, stageElement, pointerElement, sourceTileId, 0.35);
  timeline.add(() => {
    const sourceElement = getDemoTile(stageElement, sourceTileId);
    if (sourceElement === null) return;

    gsap.set(sourceElement, { zIndex: 2 });
    animatePickUp(sourceElement);
  });
  timeline.to(
    {},
    {
      duration: 0.01,
      onComplete: () => {
        const sourceElement = getDemoTile(stageElement, sourceTileId);
        const targetElement = getTargetElement();
        if (sourceElement === null || targetElement === null) return;

        const { x, y } = getCenteredTileTranslation(sourceElement, targetElement);
        const targetPointerPosition = getPointerPosition(stageElement, targetElement);
        gsap.to(sourceElement, {
          x,
          y,
          scale: 1.08,
          duration: DEMO_DRAG_DURATION,
          ease: "power2.inOut",
        });
        gsap.to(pointerElement, {
          x: targetPointerPosition.x,
          y: targetPointerPosition.y,
          duration: DEMO_DRAG_DURATION,
          ease: "power2.inOut",
        });
      },
    },
  );
  timeline.to({}, { duration: DEMO_DRAG_DURATION + DEMO_DROP_COMMIT_DELAY });
  timeline.add(() => {
    const sourceElement = getDemoTile(stageElement, sourceTileId);
    if (sourceElement !== null) {
      options.onBeforeDrop?.(sourceElement);
      gsap.set(sourceElement, { visibility: "hidden" });
    }
    onDrop();
  });
  timeline.to({}, { duration: DEMO_AFTER_DROP_PAUSE });
}

function tapTile(
  timeline: gsap.core.Timeline,
  stageElement: HTMLElement,
  pointerElement: HTMLElement,
  tileId: number,
  onTap: () => void,
) {
  movePointerToTile(timeline, stageElement, pointerElement, tileId, 0.35);
  tapPointer(timeline, pointerElement, onTap, 0.55);
}

function rotateTile(
  timeline: gsap.core.Timeline,
  stageElement: HTMLElement,
  pointerElement: HTMLElement,
  tileId: number,
  rotationCount: number,
  totalDuration: number,
) {
  const durationPerRotation = totalDuration / rotationCount;

  movePointerToTile(timeline, stageElement, pointerElement, tileId, durationPerRotation);
  for (let rotationIndex = 0; rotationIndex < rotationCount; rotationIndex++) {
    tapPointer(
      timeline,
      pointerElement,
      () => clickTile(stageElement, tileId),
      durationPerRotation,
    );
  }
}

function tapPointer(
  timeline: gsap.core.Timeline,
  pointerElement: HTMLElement,
  onTap: () => void,
  totalDuration: number,
) {
  timeline.to(pointerElement, { scale: 0.88, duration: totalDuration * 0.18 });
  timeline.add(onTap);
  timeline.to(pointerElement, { scale: 1, duration: totalDuration * 0.22 });
  timeline.to({}, { duration: totalDuration * 0.6 });
}

function clickTile(stageElement: HTMLElement, tileId: number) {
  getDemoTile(stageElement, tileId)?.click();
}

function pulseTile(stageElement: HTMLElement, tileId: number) {
  const tileElement = getDemoTile(stageElement, tileId);
  if (tileElement !== null) animateComposePulse(tileElement);
}

function getDemoTile(stageElement: HTMLElement, tileId: number): HTMLElement | null {
  return stageElement.querySelector(dataAttributeSelector(DATA_TILE_ID_ATTRIBUTE, tileId));
}

function getDemoSlot(stageElement: HTMLElement, slotIndex: number): HTMLElement | null {
  return stageElement.querySelector(dataAttributeSelector(DATA_SLOT_INDEX_ATTRIBUTE, slotIndex));
}

function getCenteredTileTranslation(sourceElement: HTMLElement, targetElement: HTMLElement) {
  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  return {
    x: targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2),
    y: targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2),
  };
}

function getPointerPosition(stageElement: HTMLElement, targetElement: HTMLElement) {
  const stageRect = stageElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  return {
    x:
      targetRect.left -
      stageRect.left +
      targetRect.width * (0.5 + DEMO_POINTER_TARGET_OFFSET_RATIO),
    y:
      targetRect.top - stageRect.top + targetRect.height * (0.5 + DEMO_POINTER_TARGET_OFFSET_RATIO),
  };
}

function ClueLegend() {
  return (
    <dl className={styles.clueLegend}>
      <ClueLegendItem evaluated={{ character: EXAMPLE_CHARACTERS.가, result: "CORRECT" }}>
        <dt>초록</dt>
        <dd>딱 맞아요</dd>
      </ClueLegendItem>
      <ClueLegendItem evaluated={{ character: EXAMPLE_CHARACTERS.나, result: "PRESENT" }}>
        <dt>노랑</dt>
        <dd>자리가 달라요</dd>
      </ClueLegendItem>
      <ClueLegendItem evaluated={{ character: EXAMPLE_CHARACTERS.다, result: "ABSENT" }}>
        <dt>회색</dt>
        <dd>낱말에 없어요</dd>
      </ClueLegendItem>
    </dl>
  );
}

function ClueLegendItem({
  evaluated,
  children,
}: {
  evaluated: EvaluatedCharacter;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.clueLegendItem}>
      <HistoryCard evaluated={evaluated} />
      <div>{children}</div>
    </div>
  );
}
