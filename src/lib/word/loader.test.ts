import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { loadWords, selectWord } from "./loader";
import { createWord } from "./word";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXTURE_WORDS = ["한국어", "사랑", "행복", "하늘", "바람"];

function makeWords() {
  return FIXTURE_WORDS.map((w) => createWord(w)!);
}

// ---------------------------------------------------------------------------
// loadWords
// ---------------------------------------------------------------------------

describe("loadWords", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => FIXTURE_WORDS,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches /data/words.json and returns validated Words", async () => {
    const words = await loadWords();
    expect(words).toHaveLength(5);
    expect(words[0]).toBe("한국어");
  });

  it("drops invalid entries silently", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ["한국어", "invalid_ascii", "사랑"],
      })),
    );
    const words = await loadWords();
    expect(words).toHaveLength(2);
    expect(words).toContain("한국어");
    expect(words).toContain("사랑");
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
    const date = "2026-01-15";
    // Spy on Date to return a fixed date
    vi.setSystemTime(new Date(date));
    const result1 = selectWord(words, { kind: "daily" });
    const result2 = selectWord(words, { kind: "daily" });
    expect(result1).toBe(result2);
    vi.useRealTimers();
  });

  it("returns a valid Word with strategy 'random'", () => {
    const result = selectWord(words, { kind: "random" });
    expect(words).toContain(result);
  });

  it("returns the specified word with strategy 'fixed'", () => {
    const result = selectWord(words, { kind: "fixed", word: "사랑" });
    expect(result).toBe("사랑");
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

  it("returns different words for different dates with strategy 'byDate'", () => {
    // With 5 words, consecutive days will cycle; 5 days apart will differ
    const results = new Set(
      Array.from({ length: 5 }, (_, i) => {
        const d = new Date("2026-01-01");
        d.setDate(d.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        return selectWord(words, { kind: "byDate", date: iso });
      }),
    );
    // Should cover all 5 words over 5 consecutive days (each day maps to a different word)
    expect(results.size).toBe(5);
  });
});
