import { describe, expect, it, vi, afterEach } from "vitest";
import { loadDailyWords, selectDailyWord } from ".";
import { createWord, wordToString } from "../word";

// ---------------------------------------------------------------------------
// loadDailyWords
// ---------------------------------------------------------------------------

describe("loadDailyWords", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the per-difficulty daily schedule and validates entries", async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => [
        { date: "2026-08-05", word: "외계인" },
        { date: "2026-08-06", word: "전화위복" },
        { date: "2026-08-07", word: "invalid_ascii" },
        { date: 42, word: "고양이" },
      ],
    }));
    vi.stubGlobal("fetch", fetchMock);

    const entries = await loadDailyWords(3);

    expect(fetchMock).toHaveBeenCalledWith("/data/daily/3.json");
    expect(entries.map((entry) => ({ date: entry.date, word: wordToString(entry.word) }))).toEqual([
      { date: "2026-08-05", word: "외계인" },
    ]);
  });

  it("returns an empty schedule when json is not an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ not: "an array" }),
      })),
    );

    await expect(loadDailyWords(4)).resolves.toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// selectDailyWord
// ---------------------------------------------------------------------------

describe("selectDailyWord", () => {
  it("returns the word scheduled for the requested date", () => {
    const entries = [
      { date: "2026-08-05", word: createWord("외계인")! },
      { date: "2026-08-06", word: createWord("고양이")! },
    ];

    expect(wordToString(selectDailyWord(entries, "2026-08-06")!)).toBe("고양이");
  });

  it("returns null when no word is scheduled for the requested date", () => {
    const entries = [{ date: "2026-08-05", word: createWord("외계인")! }];

    expect(selectDailyWord(entries, "2026-08-06")).toBeNull();
  });
});
