import { describe, it, expect } from "vitest";
import { evaluateGuess } from "./evaluate";
import { createWord } from "../word/word";
import { character } from "../character/character";
import type { SubmissionState } from "../../state/types";
import type { EvaluatedCharacter } from "./engine";

function filledSlot(syllable: string, tokenId = 0) {
  return { state: "FILLED" as const, tokenId, character: character(syllable)! };
}

const emptySlot = { state: "EMPTY" as const };

function correct(syllable: string): EvaluatedCharacter {
  return { character: character(syllable)!, result: "CORRECT" };
}

function present(syllable: string): EvaluatedCharacter {
  return { character: character(syllable)!, result: "PRESENT" };
}

function absent(syllable: string): EvaluatedCharacter {
  return { character: character(syllable)!, result: "ABSENT" };
}

const absentEmpty: EvaluatedCharacter = { result: "ABSENT" };

describe("evaluateGuess", () => {
  it.each([
    {
      label: "marks correct when all characters are in the right position",
      submission: [filledSlot("가"), filledSlot("나")] as SubmissionState,
      word: createWord("가나")!,
      expected: [correct("가"), correct("나")],
    },
    {
      label: "marks present when characters are in the word but wrong position",
      submission: [filledSlot("나"), filledSlot("가")] as SubmissionState,
      word: createWord("가나")!,
      expected: [present("나"), present("가")],
    },
    {
      label: "marks absent when characters are not in the word",
      submission: [filledSlot("다"), filledSlot("라")] as SubmissionState,
      word: createWord("가나")!,
      expected: [absent("다"), absent("라")],
    },
    {
      label: "marks absent with no character when slot is empty",
      submission: [filledSlot("가"), emptySlot] as SubmissionState,
      word: createWord("가나")!,
      expected: [correct("가"), absentEmpty],
    },
    {
      label: "does not double-count a target character as present",
      submission: [filledSlot("가"), filledSlot("가")] as SubmissionState,
      word: createWord("가나")!,
      expected: [correct("가"), absent("가")],
    },
    {
      label: "marks all correct in a fully correct multi-character word",
      submission: [filledSlot("한"), filledSlot("국"), filledSlot("어")] as SubmissionState,
      word: createWord("한국어")!,
      expected: [correct("한"), correct("국"), correct("어")],
    },
    {
      label: "does not mark present after character is consumed by a correct match",
      submission: [filledSlot("나"), filledSlot("나")] as SubmissionState,
      word: createWord("가나")!,
      expected: [absent("나"), correct("나")],
    },
  ])("$label", ({ submission, word, expected }) => {
    expect(evaluateGuess(submission, word)).toEqual(expected);
  });
});
