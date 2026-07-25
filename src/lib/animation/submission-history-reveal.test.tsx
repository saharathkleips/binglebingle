/**
 * Browser tests for the submitted-slots-to-history reveal helper.
 *
 * These run in the Chromium environment because the helper relies on layout,
 * scrolling, and cloned DOM elements.
 */
import { describe, it, expect, afterEach } from "vitest";
import { character } from "../character";
import {
  DATA_HISTORY_ANIMATION_SPACER_ATTRIBUTE,
  DATA_HISTORY_EMPTY_CARD_ATTRIBUTE,
  DATA_HISTORY_ROW_INDEX_ATTRIBUTE,
  DATA_RESULT_ATTRIBUTE,
  DATA_SLOT_HITBOX_ATTRIBUTE,
  DATA_SLOT_INDEX_ATTRIBUTE,
  DATA_SUBMISSION_HISTORY_REVEAL_CARD_ATTRIBUTE,
  DATA_SUBMISSION_SLOT_PLACEHOLDER_ATTRIBUTE,
  DATA_SUBMISSION_SLOTS_ATTRIBUTE,
  dataAttributeSelector,
} from "../dom-data-attributes";
import { gsap } from "./register";
import { createEmptyCardPulseTimeline } from "./submission-history-card";
import { animateSubmissionSlotsToHistoryReveal } from "./submission-history-reveal";

const ABSENT_EVALUATION = [{ result: "ABSENT" as const }];

afterEach(() => {
  gsap.globalTimeline.clear();
  document.body.replaceChildren();
});

describe("animateSubmissionSlotsToHistoryReveal", () => {
  it("creates reveal clones and calls lifecycle callbacks in order", () => {
    const slotsContainer = createSlotsContainer(2);
    const historyContainer = createHistoryContainer(1);
    document.body.append(historyContainer, slotsContainer);
    const calls: string[] = [];

    const timeline = animateSubmissionSlotsToHistoryReveal(
      slotsContainer,
      [
        { character: character("가")!, result: "CORRECT" },
        { character: character("나")!, result: "PRESENT" },
      ],
      historyContainer,
      {
        onBeforeRestore: () => calls.push("beforeRestore"),
        onComplete: () => calls.push("complete"),
      },
    );

    expect(timeline).toBeInstanceOf(gsap.core.Timeline);
    expect(
      slotsContainer.querySelectorAll(
        dataAttributeSelector(DATA_SUBMISSION_HISTORY_REVEAL_CARD_ATTRIBUTE),
      ),
    ).toHaveLength(2);

    timeline.progress(1);

    expect(calls).toEqual(["beforeRestore", "complete"]);
    expect(
      historyContainer.querySelector(
        dataAttributeSelector(DATA_HISTORY_ANIMATION_SPACER_ATTRIBUTE),
      ),
    ).toBeNull();
  });

  it("runs lifecycle callbacks when slot placeholders are unavailable", () => {
    const slotsContainer = document.createElement("div");
    const calls: string[] = [];

    const timeline = animateSubmissionSlotsToHistoryReveal(
      slotsContainer,
      ABSENT_EVALUATION,
      null,
      {
        onBeforeRestore: () => calls.push("beforeRestore"),
        onComplete: () => calls.push("complete"),
      },
    );

    expect(timeline).toBeInstanceOf(gsap.core.Timeline);
    timeline.progress(1);

    expect(calls).toEqual(["beforeRestore", "complete"]);
  });

  it("restores temporary history space when interrupted", () => {
    const slotsContainer = createSlotsContainer(1);
    const historyContainer = createHistoryContainer(0);
    document.body.append(historyContainer, slotsContainer);

    const timeline = animateSubmissionSlotsToHistoryReveal(
      slotsContainer,
      ABSENT_EVALUATION,
      historyContainer,
    );

    expect(
      historyContainer.querySelector(
        dataAttributeSelector(DATA_HISTORY_ANIMATION_SPACER_ATTRIBUTE),
      ),
    ).not.toBeNull();
    timeline.kill();

    expect(
      historyContainer.querySelector(
        dataAttributeSelector(DATA_HISTORY_ANIMATION_SPACER_ATTRIBUTE),
      ),
    ).toBeNull();
    expect(
      slotsContainer.querySelector(
        dataAttributeSelector(DATA_SUBMISSION_HISTORY_REVEAL_CARD_ATTRIBUTE),
      ),
    ).toBeNull();
  });

  it("restores temporary history space and completes when onBeforeRestore throws", () => {
    const slotsContainer = createSlotsContainer(1);
    const historyContainer = createHistoryContainer(0);
    const calls: string[] = [];
    document.body.append(historyContainer, slotsContainer);

    const timeline = animateSubmissionSlotsToHistoryReveal(
      slotsContainer,
      ABSENT_EVALUATION,
      historyContainer,
      {
        onBeforeRestore: () => {
          calls.push("beforeRestore");
          throw new Error("restore setup failed");
        },
        onComplete: () => calls.push("complete"),
      },
    );

    expect(() => timeline.progress(1)).toThrow("restore setup failed");
    expect(calls).toEqual(["beforeRestore", "complete"]);
    expect(
      historyContainer.querySelector(
        dataAttributeSelector(DATA_HISTORY_ANIMATION_SPACER_ATTRIBUTE),
      ),
    ).toBeNull();
  });

  it("marks empty reveal clones as empty history cards after their pulse", () => {
    const clone = document.createElement("span");
    clone.setAttribute(DATA_RESULT_ATTRIBUTE, "ABSENT");

    const timeline = createEmptyCardPulseTimeline(clone);
    timeline.progress(1);

    expect(clone.getAttribute(DATA_HISTORY_EMPTY_CARD_ATTRIBUTE)).toBe("true");
    expect(clone.hasAttribute(DATA_RESULT_ATTRIBUTE)).toBe(false);
    expect(clone.style.getPropertyValue("--lotus-motif-opacity")).toBe("");
    expect(clone.style.getPropertyValue("--lotus-motif-saturation")).toBe("");
  });

  it("keeps history-space cleanup idempotent after completion", () => {
    const slotsContainer = createSlotsContainer(1);
    const historyContainer = createHistoryContainer(0);
    document.body.append(historyContainer, slotsContainer);

    const timeline = animateSubmissionSlotsToHistoryReveal(
      slotsContainer,
      ABSENT_EVALUATION,
      historyContainer,
    );

    timeline.progress(1);
    timeline.kill();

    expect(
      historyContainer.querySelector(
        dataAttributeSelector(DATA_HISTORY_ANIMATION_SPACER_ATTRIBUTE),
      ),
    ).toBeNull();
  });
});

function createSlotsContainer(slotCount: number): HTMLElement {
  const slotsContainer = document.createElement("div");
  slotsContainer.setAttribute(DATA_SUBMISSION_SLOTS_ATTRIBUTE, "true");

  Array.from({ length: slotCount }, (_, slotIndex) => {
    const slot = document.createElement("div");
    slot.setAttribute(DATA_SLOT_INDEX_ATTRIBUTE, String(slotIndex));
    slot.setAttribute(DATA_SLOT_HITBOX_ATTRIBUTE, "true");

    const placeholder = document.createElement("span");
    placeholder.setAttribute(DATA_SUBMISSION_SLOT_PLACEHOLDER_ATTRIBUTE, "true");
    placeholder.style.display = "block";
    placeholder.style.width = "40px";
    placeholder.style.height = "60px";
    slot.appendChild(placeholder);
    slotsContainer.appendChild(slot);
  });

  return slotsContainer;
}

function createHistoryContainer(rowCount: number): HTMLElement {
  const historyContainer = document.createElement("section");
  historyContainer.style.display = "flex";
  historyContainer.style.flexDirection = "column";
  historyContainer.style.height = "80px";
  historyContainer.style.overflow = "auto";

  Array.from({ length: rowCount }, (_, rowIndex) => {
    const row = document.createElement("div");
    row.setAttribute(DATA_HISTORY_ROW_INDEX_ATTRIBUTE, String(rowIndex));
    row.style.height = "60px";
    historyContainer.appendChild(row);
  });

  return historyContainer;
}
