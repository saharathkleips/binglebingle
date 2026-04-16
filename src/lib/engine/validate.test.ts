import { describe, it, expect } from "vitest";
import { canSubmit } from "./validate";
import type { SubmissionSlot } from "../../context/game/game";
import type { Character } from "../character/character";
import { character } from "../character/character";

function filled(char: Character) {
  return { state: "FILLED" as const, tileId: 0, character: char };
}

const empty = { state: "EMPTY" as const };

describe("canSubmit", () => {
  it.each([
    {
      label:
        "returns VALID when all filled slots have complete characters (OPEN_SYLLABLE + FULL_SYLLABLE)",
      submission: [filled(character("가")!), filled(character("한")!)],
      expected: "VALID",
    },
    {
      label: "returns VALID when partial fill has a complete character (OPEN_SYLLABLE + empty)",
      submission: [filled(character("가")!), empty],
      expected: "VALID",
    },
    {
      label: "returns NO_CHARACTERS when no slots are filled",
      submission: [empty, empty],
      expected: "NO_CHARACTERS",
    },
    {
      label: "returns NO_CHARACTERS when submission is empty",
      submission: [] as readonly SubmissionSlot[],
      expected: "NO_CHARACTERS",
    },
    {
      label:
        "returns INCOMPLETE_CHARACTER when a filled slot has an incomplete character (CHOSEONG_ONLY + empty)",
      submission: [filled(character({ choseong: "ㄱ" })!), empty],
      expected: "INCOMPLETE_CHARACTER",
    },
    {
      label: "returns INCOMPLETE_CHARACTER when one complete and one incomplete slot",
      submission: [filled(character("가")!), filled(character({ choseong: "ㄱ" })!)],
      expected: "INCOMPLETE_CHARACTER",
    },
  ])("$label", ({ submission, expected }) => {
    expect(canSubmit(submission as readonly SubmissionSlot[])).toEqual(expected);
  });
});
