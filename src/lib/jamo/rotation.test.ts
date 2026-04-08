import { describe, expect, it } from "vitest";

import { getNextRotation, getRotationOptions } from "./rotation";

describe("getRotationOptions", () => {
  it("returns all set members except itself for a rotatable jamo", () => {
    expect(getRotationOptions("ㄱ")).toStrictEqual(["ㄴ"]);
  });

  it("returns members in set order for a multi-member set (clockwise: ㅏ→ㅜ→ㅓ→ㅗ)", () => {
    expect(getRotationOptions("ㅏ")).toStrictEqual(["ㅜ", "ㅓ", "ㅗ"]);
  });

  it("returns an empty array for a non-rotatable jamo", () => {
    expect(getRotationOptions("ㅎ")).toStrictEqual([]);
  });

  it("returns an empty array for a jamo not in any set", () => {
    expect(getRotationOptions("ㅊ")).toStrictEqual([]);
  });
});

describe("getNextRotation", () => {
  it("returns the next jamo in the set", () => {
    expect(getNextRotation("ㄱ")).toBe("ㄴ");
  });

  it("wraps from last member back to first", () => {
    expect(getNextRotation("ㄴ")).toBe("ㄱ");
    // ㅗ is last in ["ㅏ","ㅜ","ㅓ","ㅗ"] — wraps to ㅏ
    expect(getNextRotation("ㅗ")).toBe("ㅏ");
  });

  it("returns the second member for the first member of a 4-set", () => {
    // ㅏ is at index 0 in ["ㅏ","ㅜ","ㅓ","ㅗ"] — next is ㅜ
    expect(getNextRotation("ㅏ")).toBe("ㅜ");
  });

  it("ㅜ rotates to ㅓ (index 1 → index 2 in clockwise set)", () => {
    expect(getNextRotation("ㅜ")).toBe("ㅓ");
  });

  it("returns null for a non-rotatable jamo", () => {
    expect(getNextRotation("ㅎ")).toBeNull();
    expect(getNextRotation("ㅊ")).toBeNull();
  });
});
