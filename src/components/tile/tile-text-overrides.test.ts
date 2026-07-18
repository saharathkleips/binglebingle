import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DATA_DROP_PREVIEW_ATTRIBUTE,
  clearTileTextOverride,
  setTileTextOverride,
} from "./tile-text-overrides";

class FakeHTMLElement {
  textContent: string | null;
  private readonly attributes = new Map<string, string>();

  constructor(
    textContent: string | null = null,
    private readonly tileTextElement: unknown = null,
  ) {
    this.textContent = textContent;
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  querySelector(_selector: string): unknown {
    return this.tileTextElement;
  }
}

function installHTMLElementStub(): void {
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("tile text overrides", () => {
  it("overrides and restores tile text while preserving the original text", () => {
    installHTMLElementStub();
    const tileTextElement = new FakeHTMLElement("ㄱ");
    const element = new FakeHTMLElement(null, tileTextElement) as unknown as HTMLElement;

    setTileTextOverride(element, "ㄴ");
    setTileTextOverride(element, "ㄷ");

    expect(tileTextElement.textContent).toBe("ㄷ");
    expect(element.getAttribute(DATA_DROP_PREVIEW_ATTRIBUTE)).toBe("ㄷ");

    clearTileTextOverride(element);

    expect(tileTextElement.textContent).toBe("ㄱ");
    expect(element.hasAttribute(DATA_DROP_PREVIEW_ATTRIBUTE)).toBe(false);
  });

  it("uses an empty string when preserving missing original text", () => {
    installHTMLElementStub();
    const tileTextElement = new FakeHTMLElement(null);
    const element = new FakeHTMLElement(null, tileTextElement) as unknown as HTMLElement;

    setTileTextOverride(element, "ㅋ");
    clearTileTextOverride(element);

    expect(tileTextElement.textContent).toBe("");
  });

  it("clears an override when setting text to null", () => {
    installHTMLElementStub();
    const tileTextElement = new FakeHTMLElement("ㄹ");
    const element = new FakeHTMLElement(null, tileTextElement) as unknown as HTMLElement;
    setTileTextOverride(element, "ㅁ");

    setTileTextOverride(element, null);

    expect(tileTextElement.textContent).toBe("ㄹ");
    expect(element.hasAttribute(DATA_DROP_PREVIEW_ATTRIBUTE)).toBe(false);
  });

  it("ignores non-HTMLElement inputs", () => {
    installHTMLElementStub();
    const element = {} as Element;

    clearTileTextOverride(element);
    setTileTextOverride(element, "ㅂ");

    expect(element).toEqual({});
  });

  it("ignores elements without a tile text child", () => {
    installHTMLElementStub();
    const element = new FakeHTMLElement() as unknown as HTMLElement;

    setTileTextOverride(element, "ㅅ");
    clearTileTextOverride(element);

    expect(element.hasAttribute(DATA_DROP_PREVIEW_ATTRIBUTE)).toBe(false);
  });

  it("ignores non-HTMLElement tile text candidates", () => {
    installHTMLElementStub();
    const element = new FakeHTMLElement(null, { textContent: "ㅇ" }) as unknown as HTMLElement;

    setTileTextOverride(element, "ㅈ");

    expect(element.hasAttribute(DATA_DROP_PREVIEW_ATTRIBUTE)).toBe(false);
  });
});
