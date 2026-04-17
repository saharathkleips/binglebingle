import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { loadWords, selectWord } from ".";
import { createWord, wordToString } from "../word";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXTURE_STRINGS = ["한국어", "고양이", "강아지", "도서관", "바나나"];

function makeWords() {
  return FIXTURE_STRINGS.map((w) => createWord(w)!);
}

// ---------------------------------------------------------------------------
// loadWords
// ---------------------------------------------------------------------------

describe("loadWords", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => FIXTURE_STRINGS,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches /data/words.json and returns validated Words", async () => {
    const words = await loadWords();
    expect(words).toHaveLength(5);
    expect(wordToString(words[0]!)).toBe("한국어");
  });

  it("drops invalid entries silently", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ["한국어", "invalid_ascii", "고양이"],
      })),
    );
    const words = await loadWords();
    expect(words).toHaveLength(2);
    expect(wordToString(words[0]!)).toBe("한국어");
    expect(wordToString(words[1]!)).toBe("고양이");
  });

  it("returns empty array when json is not an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ not: "an array" }),
      })),
    );
    const words = await loadWords();
    expect(words).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// selectWord
// ---------------------------------------------------------------------------

describe("selectWord", () => {
  const words = makeWords();

  it("returns the same word for the same date with strategy 'daily'", () => {
    vi.setSystemTime(new Date("2026-01-15"));
    const result1 = selectWord(words, { kind: "daily" });
    const result2 = selectWord(words, { kind: "daily" });
    expect(result1).toBe(result2);
    vi.useRealTimers();
  });

  it("returns a valid Word with strategy 'random'", () => {
    const result = selectWord(words, { kind: "random" });
    expect(words).toContain(result);
  });

  it("returns the matching word with strategy 'fixed'", () => {
    const result = selectWord(words, { kind: "fixed", word: "고양이" });
    expect(wordToString(result)).toBe("고양이");
  });

  it("falls back to the first word when 'fixed' word is not in the list", () => {
    const result = selectWord(words, { kind: "fixed", word: "없는단어" });
    expect(result).toBe(words[0]);
  });

  it("returns the same word for the same date with strategy 'byDate'", () => {
    const result1 = selectWord(words, { kind: "byDate", date: "2026-04-13" });
    const result2 = selectWord(words, { kind: "byDate", date: "2026-04-13" });
    expect(result1).toBe(result2);
    expect(words).toContain(result1);
  });

  it("covers all 5 words across 5 consecutive dates with strategy 'byDate'", () => {
    const results = new Set(
      Array.from({ length: 5 }, (_, i) => {
        const d = new Date("2026-01-01");
        d.setDate(d.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        return selectWord(words, { kind: "byDate", date: iso });
      }),
    );
    expect(results.size).toBe(5);
  });
});
