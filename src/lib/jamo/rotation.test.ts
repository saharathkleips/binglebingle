import { describe, expect, it } from "vitest";

import { getNextRotation, getRotationOptions } from "./rotation";

describe("getRotationOptions", () => {
  it("returns all set members except itself for a rotatable jamo", () => {
    expect(getRotationOptions("ㄱ")).toStrictEqual(["ㄴ"]);
  });

  it("returns members in set order for a multi-member set", () => {
    expect(getRotationOptions("ㅏ")).toStrictEqual(["ㅓ", "ㅗ", "ㅜ"]);
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
    expect(getNextRotation("ㅜ")).toBe("ㅏ");
  });

  it("returns the second member for the first member of a 4-set", () => {
    expect(getNextRotation("ㅏ")).toBe("ㅓ");
  });

  it("returns null for a non-rotatable jamo", () => {
    expect(getNextRotation("ㅎ")).toBeNull();
    expect(getNextRotation("ㅊ")).toBeNull();
  });
});
