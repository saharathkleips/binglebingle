import { describe, expect, it } from "vitest";
import { character } from "./character";
import { buildShareSummary } from "./share-summary";
import type { CharacterResult, GuessRecord } from "./engine";

const mixedGuess: GuessRecord = [
  { character: character("고")!, result: "CORRECT" },
  { character: character("양")!, result: "PRESENT" },
  { character: character("이")!, result: "ABSENT" },
];

const emptySlotGuess: GuessRecord = [{ result: "ABSENT" }];

function guessFromResults(results: readonly CharacterResult[]): GuessRecord {
  return results.map((result) => ({ character: character("고")!, result }));
}

function guessFromSlots(slots: readonly (CharacterResult | "EMPTY")[]): GuessRecord {
  return slots.map((slot) => {
    if (slot === "EMPTY") return { result: "ABSENT" as const };
    return { character: character("고")!, result: slot };
  });
}

describe("buildShareSummary", () => {
  it("builds the Korean date/count header and emoji grid", () => {
    expect(buildShareSummary({ history: [mixedGuess], date: "2026-08-15" })).toBe(
      "빙글빙글 8/15 · 3칸 · 1회\n🟩🟨⬜",
    );
  });

  it("uses black squares for unsubmitted empty slots", () => {
    expect(buildShareSummary({ history: [emptySlotGuess], date: "2026-08-15" })).toBe(
      "빙글빙글 8/15 · 1칸 · 1회\n⬛",
    );
  });

  it("distinguishes submitted absent slots from unsubmitted empty slots", () => {
    expect(
      buildShareSummary({ history: [guessFromSlots(["ABSENT", "EMPTY"])], date: "2026-08-15" }),
    ).toBe("빙글빙글 8/15 · 2칸 · 1회\n⬜⬛");
  });

  it("renders empty slots alongside correct and present results", () => {
    expect(
      buildShareSummary({
        history: [guessFromSlots(["CORRECT", "EMPTY", "PRESENT"])],
        date: "2026-08-15",
      }),
    ).toBe("빙글빙글 8/15 · 3칸 · 1회\n🟩⬛🟨");
  });

  it("compacts repeated guesses with empty slots while preserving black for empties", () => {
    const history = [
      ...Array.from({ length: 3 }, () => guessFromSlots(["CORRECT", "EMPTY", "EMPTY"])),
      guessFromSlots(["CORRECT", "CORRECT", "CORRECT"]),
    ];

    expect(buildShareSummary({ history, date: "2026-08-15" })).toBe(
      ["빙글빙글 8/15 · 3칸 · 4회", "🟩⬛⬛ ×3", "🟩🟩🟩"].join("\n"),
    );
  });

  it.each([
    {
      label: "all absent guesses",
      repeatedResults: ["ABSENT", "ABSENT", "ABSENT"] satisfies readonly CharacterResult[],
      repeatedLine: "⬜⬜⬜ ×4",
    },
    {
      label: "green/gray/gray guesses",
      repeatedResults: ["CORRECT", "ABSENT", "ABSENT"] satisfies readonly CharacterResult[],
      repeatedLine: "🟩⬜⬜ ×4",
    },
    {
      label: "yellow/green/gray guesses",
      repeatedResults: ["PRESENT", "CORRECT", "ABSENT"] satisfies readonly CharacterResult[],
      repeatedLine: "🟨🟩⬜ ×4",
    },
  ])("compacts repeated $label", ({ repeatedResults, repeatedLine }) => {
    const history = [
      ...Array.from({ length: 4 }, () => guessFromResults(repeatedResults)),
      guessFromResults(["CORRECT", "CORRECT", "CORRECT"]),
    ];

    expect(buildShareSummary({ history, date: "2026-08-15" })).toBe(
      ["빙글빙글 8/15 · 3칸 · 5회", repeatedLine, "🟩🟩🟩"].join("\n"),
    );
  });

  it("compacts runs before applying the 9-row share limit", () => {
    const history = [
      ...Array.from({ length: 9 }, () => guessFromResults(["ABSENT", "ABSENT", "ABSENT"])),
      guessFromResults(["CORRECT", "CORRECT", "CORRECT"]),
    ];

    expect(buildShareSummary({ history, date: "2026-08-15" })).toBe(
      [
        "빙글빙글 8/15 · 3칸 · 10회",
        // These 9 guesses would overflow without run compaction.
        "⬜⬜⬜ ×9",
        // The solved row stays visible.
        "🟩🟩🟩",
      ].join("\n"),
    );
  });

  it("compacts each consecutive run independently without merging separated matching rows", () => {
    const history = [
      ...Array.from({ length: 2 }, () => guessFromResults(["CORRECT", "ABSENT", "ABSENT"])),
      guessFromResults(["PRESENT", "ABSENT", "ABSENT"]),
      ...Array.from({ length: 3 }, () => guessFromResults(["CORRECT", "ABSENT", "ABSENT"])),
      guessFromResults(["CORRECT", "CORRECT", "CORRECT"]),
    ];

    expect(buildShareSummary({ history, date: "2026-08-15" })).toBe(
      ["빙글빙글 8/15 · 3칸 · 7회", "🟩⬜⬜ ×2", "🟨⬜⬜", "🟩⬜⬜ ×3", "🟩🟩🟩"].join("\n"),
    );
  });

  it("shows a full compacted result with an omitted-guess line when it still exceeds the share height", () => {
    const history: GuessRecord[] = [
      ...Array.from({ length: 2 }, () => guessFromResults(["CORRECT", "ABSENT", "ABSENT"])),
      guessFromResults(["PRESENT", "ABSENT", "ABSENT"]),
      ...Array.from({ length: 3 }, () => guessFromResults(["ABSENT", "PRESENT", "ABSENT"])),
      guessFromResults(["ABSENT", "ABSENT", "PRESENT"]),
      ...Array.from({ length: 2 }, () => guessFromResults(["CORRECT", "PRESENT", "ABSENT"])),
      guessFromResults(["PRESENT", "CORRECT", "ABSENT"]),
      ...Array.from({ length: 4 }, () => guessFromResults(["ABSENT", "CORRECT", "PRESENT"])),
      guessFromResults(["PRESENT", "ABSENT", "CORRECT"]),
      ...Array.from({ length: 2 }, () => guessFromResults(["ABSENT", "PRESENT", "CORRECT"])),
      guessFromResults(["CORRECT", "PRESENT", "ABSENT"]),
      ...Array.from({ length: 2 }, () => guessFromResults(["PRESENT", "ABSENT", "CORRECT"])),
      guessFromResults(["ABSENT", "CORRECT", "PRESENT"]),
      guessFromResults(["CORRECT", "CORRECT", "CORRECT"]),
    ];

    expect(buildShareSummary({ history, date: "2026-08-15" })).toBe(
      [
        "빙글빙글 8/15 · 3칸 · 22회",
        "🟩⬜⬜ ×2",
        "🟨⬜⬜",
        "⬜🟨⬜ ×3",
        "⬜⬜🟨",
        "➖➖➖ +10",
        "🟩🟨⬜",
        "🟨⬜🟩 ×2",
        "⬜🟩🟨",
        "🟩🟩🟩",
      ].join("\n"),
    );
  });
});
