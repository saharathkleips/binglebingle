import { describe, it, expect } from "vitest";
import { calculateScore } from "./scoring";
import type { GuessRecord } from "./engine";
import { character } from "../character";

const dummyGuess: GuessRecord = [{ character: character("가")!, result: "CORRECT" }];

describe("calculateScore", () => {
  it("returns guessCount of 0 when there are no guesses", () => {
    expect(calculateScore([])).toEqual({ guessCount: 0 });
  });

  it("returns guessCount matching the number of guesses", () => {
    expect(calculateScore([dummyGuess])).toEqual({ guessCount: 1 });
    expect(calculateScore([dummyGuess, dummyGuess, dummyGuess])).toEqual({ guessCount: 3 });
  });
});
