import { describe, it, expect } from "vitest";
import { canSubmit } from "./validate";
import type { SubmissionState } from "../../state/types";
import { character } from "../character/character";

const completeOpen = character("가")!; // OPEN_SYLLABLE — complete
const completeFull = character("한")!; // FULL_SYLLABLE — complete
const incompleteChoseong = character({ choseong: "ㄱ" })!; // CHOSEONG_ONLY — incomplete

function filled(char: NonNullable<ReturnType<typeof character>>) {
  return { filled: true as const, tokenId: 0, character: char };
}

const empty = { filled: false as const };

describe("canSubmit", () => {
  it.each([
    {
      label: "returns valid:true when all filled slots have complete characters",
      submission: [filled(completeOpen), filled(completeFull)],
      expected: { valid: true },
    },
    {
      label: "returns valid:true when partial fill has complete characters",
      submission: [filled(completeOpen), empty],
      expected: { valid: true },
    },
    {
      label: "returns NO_CHARACTERS when no slots are filled",
      submission: [empty, empty],
      expected: { valid: false, reason: "NO_CHARACTERS" },
    },
    {
      label: "returns NO_CHARACTERS when submission is empty",
      submission: [] as SubmissionState,
      expected: { valid: false, reason: "NO_CHARACTERS" },
    },
    {
      label: "returns INCOMPLETE_CHARACTER when a filled slot has an incomplete character",
      submission: [filled(incompleteChoseong), empty],
      expected: { valid: false, reason: "INCOMPLETE_CHARACTER" },
    },
    {
      label: "returns INCOMPLETE_CHARACTER when one complete and one incomplete slot",
      submission: [filled(completeOpen), filled(incompleteChoseong)],
      expected: { valid: false, reason: "INCOMPLETE_CHARACTER" },
    },
  ])("$label", ({ submission, expected }) => {
    expect(canSubmit(submission as SubmissionState)).toEqual(expected);
  });
});
