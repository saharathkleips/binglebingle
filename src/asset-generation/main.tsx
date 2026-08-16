import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import "./asset-generation.css";
import { FaviconPreview } from "./FaviconPreview";
import { SocialPreview } from "./SocialPreview";

type GeneratedAssetKind = "favicon" | "social-preview";

const DEFAULT_FAVICON_SIZE = 512;
const DEFAULT_SOCIAL_PREVIEW_WIDTH = 1200;
const DEFAULT_SOCIAL_PREVIEW_HEIGHT = 630;
const searchParams = new URLSearchParams(window.location.search);
const assetKind = parseAssetKind(searchParams.get("asset"));
const size = parsePositiveInteger(searchParams.get("size"), "size", DEFAULT_FAVICON_SIZE);
const width = parsePositiveInteger(
  searchParams.get("width"),
  "width",
  DEFAULT_SOCIAL_PREVIEW_WIDTH,
);
const height = parsePositiveInteger(
  searchParams.get("height"),
  "height",
  DEFAULT_SOCIAL_PREVIEW_HEIGHT,
);
const rootElement = document.getElementById("root");

if (rootElement === null) throw new Error("Missing generated asset root element.");

createRoot(rootElement).render(
  <StrictMode>
    {assetKind === "favicon" ? <FaviconPreview size={size} /> : null}
    {assetKind === "social-preview" ? <SocialPreview width={width} height={height} /> : null}
  </StrictMode>,
);

function parseAssetKind(value: string | null): GeneratedAssetKind {
  if (value === "favicon" || value === null) return "favicon";
  if (value === "social-preview") return "social-preview";
  throw new Error(`Unsupported generated asset: ${value}`);
}

function parsePositiveInteger(value: string | null, name: string, fallback: number): number {
  if (value === null) return fallback;
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Asset preview ${name} must be a positive integer, received: ${value}`);
  }
  return parsedValue;
}
