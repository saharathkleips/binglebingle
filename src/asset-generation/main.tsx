import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import "./asset-generation.css";
import { FaviconPreview } from "./FaviconPreview";

type GeneratedAssetKind = "favicon";

const DEFAULT_PREVIEW_SIZE = 512;
const assetKind = parseAssetKind(new URLSearchParams(window.location.search).get("asset"));
const size = parsePreviewSize(new URLSearchParams(window.location.search).get("size"));
const rootElement = document.getElementById("root");

if (rootElement === null) throw new Error("Missing generated asset root element.");

createRoot(rootElement).render(
  <StrictMode>{assetKind === "favicon" ? <FaviconPreview size={size} /> : null}</StrictMode>,
);

function parseAssetKind(value: string | null): GeneratedAssetKind {
  if (value === "favicon" || value === null) return "favicon";
  throw new Error(`Unsupported generated asset: ${value}`);
}

function parsePreviewSize(value: string | null): number {
  if (value === null) return DEFAULT_PREVIEW_SIZE;
  const size = Number(value);
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error(`Asset preview size must be a positive integer, received: ${value}`);
  }
  return size;
}
