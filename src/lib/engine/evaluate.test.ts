import { describe, it, expect } from "vitest";
import { evaluateGuess } from "./evaluate";
import { createWord } from "../word/word";
import { character } from "../character/character";
import type { EvaluatedCharacter } from "./engine";

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
      submission: [character("가")!, character("나")!],
      word: createWord("가나")!,
      expected: [correct("가"), correct("나")],
    },
    {
      label: "marks present when characters are in the word but wrong position",
      submission: [character("나")!, character("가")!],
      word: createWord("가나")!,
      expected: [present("나"), present("가")],
    },
    {
      label: "marks absent when characters are not in the word",
      submission: [character("다")!, character("라")!],
      word: createWord("가나")!,
      expected: [absent("다"), absent("라")],
    },
    {
      label: "marks absent with no character when slot is empty",
      submission: [character("가")!, null],
      word: createWord("가나")!,
      expected: [correct("가"), absentEmpty],
    },
    {
      label: "does not double-count a target character as present",
      submission: [character("가")!, character("가")!],
      word: createWord("가나")!,
      expected: [correct("가"), absent("가")],
    },
    {
      label: "marks all correct in a fully correct multi-character word",
      submission: [character("한")!, character("국")!, character("어")!],
      word: createWord("한국어")!,
      expected: [correct("한"), correct("국"), correct("어")],
    },
    {
      label: "does not mark present after character is consumed by a correct match",
      submission: [character("나")!, character("나")!],
      word: createWord("가나")!,
      expected: [absent("나"), correct("나")],
    },
    {
      label:
        "marks both as correct when the word contains a duplicate character and both are matched",
      submission: [character("나")!, character("나")!],
      word: createWord("나나")!,
      expected: [correct("나"), correct("나")],
    },
    {
      label: "marks correct then absent when word has a duplicate and only the first slot matches",
      submission: [character("나")!, character("가")!],
      word: createWord("나나")!,
      expected: [correct("나"), absent("가")],
    },
    {
      label: "marks absent then correct when word has a duplicate and only the second slot matches",
      submission: [character("가")!, character("나")!],
      word: createWord("나나")!,
      expected: [absent("가"), correct("나")],
    },
    {
      label: "produces correct, present, and absent results in a single submission",
      submission: [character("가")!, character("다")!, character("라")!],
      word: createWord("가나다")!,
      expected: [correct("가"), present("다"), absent("라")],
    },
    {
      label:
        "marks correct then present when a duplicate word character is matched in both positions",
      submission: [character("나")!, character("나")!, character("다")!],
      word: createWord("나가나")!,
      expected: [correct("나"), present("나"), absent("다")],
    },
  ])("$label", ({ submission, word, expected }) => {
    expect(evaluateGuess(submission, word)).toEqual(expected);
  });
});
