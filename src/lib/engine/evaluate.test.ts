import { describe, it, expect } from "vitest";
import { evaluateGuess } from "./evaluate";
import { createWord } from "../word/word";
import { character } from "../character/character";
import type { SubmissionState } from "../../state/types";

const word가나 = createWord("가나")!;
const word한국어 = createWord("한국어")!;

function filledSlot(syllable: string, tokenId = 0) {
  return { filled: true as const, tokenId, character: character(syllable)! };
}

const emptySlot = { filled: false as const };

describe("evaluateGuess", () => {
  it("marks a character as correct when it is in the right position", () => {
    const submission: SubmissionState = [filledSlot("가"), filledSlot("나")];
    const result = evaluateGuess(submission, word가나);
    expect(result[0]).toEqual({ character: "가", result: "correct" });
    expect(result[1]).toEqual({ character: "나", result: "correct" });
  });

  it("marks a character as present when it is in the word but wrong position", () => {
    const submission: SubmissionState = [filledSlot("나"), filledSlot("가")];
    const result = evaluateGuess(submission, word가나);
    expect(result[0]).toEqual({ character: "나", result: "present" });
    expect(result[1]).toEqual({ character: "가", result: "present" });
  });

  it("marks a character as absent when it is not in the word", () => {
    const submission: SubmissionState = [filledSlot("다"), filledSlot("라")];
    const result = evaluateGuess(submission, word가나);
    expect(result[0]).toEqual({ character: "다", result: "absent" });
    expect(result[1]).toEqual({ character: "라", result: "absent" });
  });

  it("marks empty slots as absent with empty character string", () => {
    const submission: SubmissionState = [filledSlot("가"), emptySlot];
    const result = evaluateGuess(submission, word가나);
    expect(result[1]).toEqual({ character: "", result: "absent" });
  });

  it("does not double-count a target character as present", () => {
    // word is 가나; guess is 가가 — second 가 should be absent (first consumed by correct match)
    const submission: SubmissionState = [filledSlot("가"), filledSlot("가")];
    const result = evaluateGuess(submission, word가나);
    expect(result[0]).toEqual({ character: "가", result: "correct" });
    expect(result[1]).toEqual({ character: "가", result: "absent" });
  });

  it("handles a fully correct multi-character word", () => {
    const submission: SubmissionState = [filledSlot("한"), filledSlot("국"), filledSlot("어")];
    const result = evaluateGuess(submission, word한국어);
    expect(result.every((e) => e.result === "correct")).toBe(true);
  });

  it("does not mark a character present after it has been consumed by a correct match", () => {
    // word is 가나; guess is 나나 — index 1 is correct (나=나), leaving no 나 for index 0 → absent
    const submission: SubmissionState = [filledSlot("나"), filledSlot("나")];
    const result = evaluateGuess(submission, word가나);
    expect(result[0]).toEqual({ character: "나", result: "absent" });
    expect(result[1]).toEqual({ character: "나", result: "correct" });
  });
});
