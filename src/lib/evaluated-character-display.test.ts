import { describe, expect, it } from "vitest";
import { character } from "./character";
import {
  getEvaluatedCharacterText,
  isEvaluatedCharacterEmpty,
} from "./evaluated-character-display";
import type { EvaluatedCharacter } from "./engine";

describe("evaluated character display", () => {
  it.each([
    [{ result: "ABSENT" }, ""],
    [{ character: character("가")!, result: "CORRECT" }, "가"],
    [{ character: character()!, result: "ABSENT" }, ""],
  ] as const)("resolves %o to display text %s", (evaluated, expectedText) => {
    expect(getEvaluatedCharacterText(evaluated as EvaluatedCharacter)).toBe(expectedText);
  });

  it.each([
    [{ result: "ABSENT" }, true],
    [{ character: character("가")!, result: "CORRECT" }, false],
    [{ character: character()!, result: "ABSENT" }, true],
  ] as const)("detects whether %o is empty", (evaluated, expectedIsEmpty) => {
    expect(isEvaluatedCharacterEmpty(evaluated as EvaluatedCharacter)).toBe(expectedIsEmpty);
  });
});
