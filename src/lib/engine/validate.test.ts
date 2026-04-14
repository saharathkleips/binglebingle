import { describe, it, expect } from "vitest";
import { canSubmit } from "./validate";
import type { SubmissionState } from "../../state/types";
import { character } from "../character/character";

// 가 = OPEN_SYLLABLE (complete), ㄱ = CHOSEONG_ONLY (incomplete)
const 가 = character("가")!;
const 한 = character("한")!;
const ㄱOnly = character({ choseong: "ㄱ" })!;

describe("canSubmit", () => {
  it("returns valid:true when all filled slots have complete characters", () => {
    const submission: SubmissionState = [
      { filled: true, tokenId: 0, character: 가 },
      { filled: true, tokenId: 1, character: 한 },
    ];
    expect(canSubmit(submission)).toEqual({ valid: true });
  });

  it("returns valid:true with partial fill when filled slots are complete", () => {
    const submission: SubmissionState = [
      { filled: true, tokenId: 0, character: 가 },
      { filled: false },
    ];
    expect(canSubmit(submission)).toEqual({ valid: true });
  });

  it("returns NO_CHARACTERS when no slots are filled", () => {
    const submission: SubmissionState = [{ filled: false }, { filled: false }];
    expect(canSubmit(submission)).toEqual({ valid: false, reason: "NO_CHARACTERS" });
  });

  it("returns NO_CHARACTERS when submission is empty", () => {
    const submission: SubmissionState = [];
    expect(canSubmit(submission)).toEqual({ valid: false, reason: "NO_CHARACTERS" });
  });

  it("returns INCOMPLETE_CHARACTER when a filled slot has an incomplete character", () => {
    const submission: SubmissionState = [
      { filled: true, tokenId: 0, character: ㄱOnly },
      { filled: false },
    ];
    expect(canSubmit(submission)).toEqual({ valid: false, reason: "INCOMPLETE_CHARACTER" });
  });

  it("returns INCOMPLETE_CHARACTER when one slot is complete and another is incomplete", () => {
    const submission: SubmissionState = [
      { filled: true, tokenId: 0, character: 가 },
      { filled: true, tokenId: 1, character: ㄱOnly },
    ];
    expect(canSubmit(submission)).toEqual({ valid: false, reason: "INCOMPLETE_CHARACTER" });
  });
});
