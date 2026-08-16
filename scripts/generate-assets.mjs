import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputDirectory = path.join(projectRoot, "public");
const port = Number(process.env["ASSET_GENERATOR_PORT"] ?? "5174");
const origin = `http://127.0.0.1:${port}`;
const pagePath = "/binglebingle/asset-generator.html";
const assetFontFamily = "Binglebingle Asset Tile";
// Keep downloaded fonts outside the repo. The binary is small because the
// Google Fonts request subsets Noto Sans KR to the favicon jamo only.
const assetFontCachePath = path.join(
  os.tmpdir(),
  "binglebingle-generated-assets",
  "fonts",
  "noto-sans-kr-900-ㅂ.woff2",
);
const googleFontsCssUrl =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@900&display=swap&text=%E3%85%82";

const faviconOutputs = [
  { fileName: "favicon-16x16.png", size: 16 },
  { fileName: "favicon-32x32.png", size: 32 },
  { fileName: "apple-touch-icon.png", size: 180 },
  { fileName: "favicon.png", size: 512 },
];

const server = spawn(
  "pnpm",
  ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
  },
);

server.stdout.on("data", (chunk) => process.stdout.write(chunk));
server.stderr.on("data", (chunk) => process.stderr.write(chunk));

try {
  await waitForServer(`${origin}${pagePath}`);
  await mkdir(outputDirectory, { recursive: true });
  const assetFont = await loadAssetFont();

  const browser = await chromium.launch();
  try {
    const generatedPngs = new Map();

    for (const output of faviconOutputs) {
      const buffer = await captureAsset({
        browser,
        asset: "favicon",
        size: output.size,
        assetFont,
      });
      generatedPngs.set(output.size, buffer);
      await writeFile(path.join(outputDirectory, output.fileName), buffer);
      process.stdout.write(`wrote public/${output.fileName}\n`);
    }

    const iconBuffer = createIco([
      { size: 16, png: generatedPngs.get(16) },
      { size: 32, png: generatedPngs.get(32) },
    ]);
    await writeFile(path.join(outputDirectory, "favicon.ico"), iconBuffer);
    process.stdout.write("wrote public/favicon.ico\n");
  } finally {
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}

async function captureAsset({ browser, asset, size, assetFont }) {
  const context = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  try {
    const page = await context.newPage();
    await page.goto(`${origin}${pagePath}?asset=${asset}&size=${size}`);
    await installAssetFont(page, assetFont);
    const preview = page.locator(`[data-asset-preview="${asset}"]`);
    await preview.waitFor({ state: "visible" });
    return await preview.screenshot({ animations: "disabled", omitBackground: true, scale: "css" });
  } finally {
    await context.close();
  }
}

async function loadAssetFont() {
  try {
    return await readFile(assetFontCachePath);
  } catch (error) {
    if (!isFileNotFoundError(error)) throw error;
  }

  let css;
  try {
    const cssResponse = await fetch(googleFontsCssUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 BinglebingleAssetGenerator/1.0",
      },
    });
    if (!cssResponse.ok) {
      throw new Error(`Google Fonts CSS request failed with HTTP ${cssResponse.status}.`);
    }
    css = await cssResponse.text();
  } catch (error) {
    throw new Error(
      `Could not download Noto Sans KR from Google Fonts. Re-run with network access or provide the cached font at ${assetFontCachePath}.`,
      { cause: error },
    );
  }

  const fontUrl = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
  if (fontUrl === undefined) {
    throw new Error("Could not find a WOFF2 font URL in the Google Fonts CSS response.");
  }

  try {
    const fontResponse = await fetch(fontUrl);
    if (!fontResponse.ok) {
      throw new Error(`Google Fonts file request failed with HTTP ${fontResponse.status}.`);
    }
    const font = Buffer.from(await fontResponse.arrayBuffer());
    await mkdir(path.dirname(assetFontCachePath), { recursive: true });
    await writeFile(assetFontCachePath, font);
    return font;
  } catch (error) {
    throw new Error(
      `Could not download Noto Sans KR from Google Fonts. Re-run with network access or provide the cached font at ${assetFontCachePath}.`,
      { cause: error },
    );
  }
}

async function installAssetFont(page, font) {
  // Inject the cached font directly into the page so screenshots do not depend
  // on OS-installed fonts or external network timing during capture.
  const fontDataUrl = `data:font/woff2;base64,${font.toString("base64")}`;
  await page.addStyleTag({
    content: `@font-face { font-family: "${assetFontFamily}"; src: url("${fontDataUrl}") format("woff2"); font-weight: 900; font-style: normal; font-display: block; }`,
  });
  await page.evaluate(
    (fontFamily) => document.fonts.load(`900 100px "${fontFamily}"`, "ㅂ"),
    assetFontFamily,
  );
  await page.evaluate(() => document.fonts.ready);
}

function isFileNotFoundError(error) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function waitForServer(url) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < 30_000) {
    if (server.exitCode !== null) {
      throw new Error(`Asset generator server exited with code ${server.exitCode}.`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`Received HTTP ${response.status} from ${url}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${url}`, { cause: lastError });
}

function createIco(entries) {
  const headerSize = 6;
  const directoryEntrySize = 16;
  const imageStartOffset = headerSize + directoryEntrySize * entries.length;
  const directory = Buffer.alloc(imageStartOffset);
  let imageOffset = imageStartOffset;

  directory.writeUInt16LE(0, 0);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(entries.length, 4);

  const images = [];

  entries.forEach((entry, index) => {
    if (!Buffer.isBuffer(entry.png)) {
      throw new Error(`Missing ${entry.size}x${entry.size} PNG buffer for favicon.ico.`);
    }

    const offset = headerSize + index * directoryEntrySize;
    directory.writeUInt8(entry.size, offset);
    directory.writeUInt8(entry.size, offset + 1);
    directory.writeUInt8(0, offset + 2);
    directory.writeUInt8(0, offset + 3);
    directory.writeUInt16LE(1, offset + 4);
    directory.writeUInt16LE(32, offset + 6);
    directory.writeUInt32LE(entry.png.length, offset + 8);
    directory.writeUInt32LE(imageOffset, offset + 12);

    images.push(entry.png);
    imageOffset += entry.png.length;
  });

  return Buffer.concat([directory, ...images]);
}
