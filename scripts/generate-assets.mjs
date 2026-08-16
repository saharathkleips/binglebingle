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
const assetFontLoadSampleText = "빙글빙글";
// Keep downloaded fonts outside the repo. The cached CSS embeds the Google Fonts
// WOFF2 files as data URLs so screenshots do not depend on network timing.
const assetFontCachePath = path.join(
  os.tmpdir(),
  "binglebingle-generated-assets",
  "fonts",
  "noto-sans-kr-variable-full-v1.css",
);
const googleFontsCssUrl =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap";

const faviconOutputs = [
  { fileName: "favicon-16x16.png", size: 16, renderScale: 8 },
  { fileName: "favicon-32x32.png", size: 32, renderScale: 8 },
  { fileName: "apple-touch-icon.png", size: 180, renderScale: 4 },
  { fileName: "favicon.png", size: 512, renderScale: 2 },
];

const socialPreviewOutput = {
  fileName: "share-preview.png",
  width: 1200,
  height: 630,
  renderScale: 2,
};

// Generated assets are intended to be produced manually on a GPU-backed host,
// not in CI or a software-rendered container. These flags keep headless Chromium
// on its GPU raster path where available; the high-DPR screenshot is then
// downsampled with ImageMagick for smoother final PNGs.
const chromiumLaunchArgs = ["--enable-gpu", "--force-gpu-rasterization", "--ignore-gpu-blocklist"];

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
  const assetFontCss = await loadAssetFontCss();

  const browser = await chromium.launch({ args: chromiumLaunchArgs });
  try {
    const generatedPngs = new Map();

    for (const output of faviconOutputs) {
      const buffer = await captureAsset({
        browser,
        asset: "favicon",
        size: output.size,
        assetFontCss,
        renderScale: output.renderScale,
      });
      assertPngDimensions(buffer, {
        fileName: output.fileName,
        width: output.size,
        height: output.size,
      });
      generatedPngs.set(output.size, buffer);
      await writeFile(path.join(outputDirectory, output.fileName), buffer);
      process.stdout.write(`wrote public/${output.fileName}\n`);
    }

    const iconBuffer = createIco([
      { size: 16, png: generatedPngs.get(16) },
      { size: 32, png: generatedPngs.get(32) },
    ]);
    assertIcoDimensions(iconBuffer, {
      fileName: "favicon.ico",
      sizes: [16, 32],
    });
    await writeFile(path.join(outputDirectory, "favicon.ico"), iconBuffer);
    process.stdout.write("wrote public/favicon.ico\n");

    const socialPreviewBuffer = await captureAsset({
      browser,
      asset: "social-preview",
      width: socialPreviewOutput.width,
      height: socialPreviewOutput.height,
      assetFontCss,
      renderScale: socialPreviewOutput.renderScale,
    });
    assertPngDimensions(socialPreviewBuffer, socialPreviewOutput);
    await writeFile(path.join(outputDirectory, socialPreviewOutput.fileName), socialPreviewBuffer);
    process.stdout.write(`wrote public/${socialPreviewOutput.fileName}\n`);
  } finally {
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}

async function captureAsset({
  browser,
  asset,
  size,
  width = size,
  height = size,
  assetFontCss,
  renderScale,
}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: renderScale,
  });
  try {
    const page = await context.newPage();
    // Manual previews use the Google Fonts link in asset-generator.html, but CLI
    // captures should rely only on the cached embedded CSS injected below.
    await page.route(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/, (route) =>
      route.abort("blockedbyclient"),
    );
    const searchParams = new URLSearchParams({
      asset,
      width: String(width),
      height: String(height),
    });
    if (size !== undefined) searchParams.set("size", String(size));
    await page.goto(`${origin}${pagePath}?${searchParams.toString()}`, {
      waitUntil: "domcontentloaded",
    });
    await installAssetFont(page, assetFontCss);
    const preview = page.locator(`[data-asset-preview="${asset}"]`);
    await preview.waitFor({ state: "visible" });
    const screenshot = await preview.screenshot({
      animations: "disabled",
      omitBackground: true,
    });
    if (renderScale === 1) return screenshot;
    return await resizePngWithImageMagick(screenshot, { width, height });
  } finally {
    await context.close();
  }
}

async function resizePngWithImageMagick(buffer, { width, height }) {
  return await new Promise((resolve, reject) => {
    const resize = spawn("convert", [
      "png:-",
      "-filter",
      "Lanczos",
      "-resize",
      `${width}x${height}!`,
      "PNG32:-",
    ]);
    const stdoutChunks = [];
    const stderrChunks = [];

    resize.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    resize.stderr.on("data", (chunk) => stderrChunks.push(chunk));
    resize.on("error", reject);
    resize.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdoutChunks));
        return;
      }

      const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
      reject(new Error(`ImageMagick resize failed with code ${code}: ${stderr}`));
    });

    resize.stdin.end(buffer);
  });
}

async function loadAssetFontCss() {
  try {
    return await readFile(assetFontCachePath, "utf8");
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
      `Could not download Noto Sans KR from Google Fonts. Re-run with network access or provide the cached font CSS at ${assetFontCachePath}.`,
      { cause: error },
    );
  }

  const fontUrls = [
    ...new Set(
      [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((match) => match[1]),
    ),
  ];
  if (fontUrls.length === 0) {
    throw new Error("Could not find WOFF2 font URLs in the Google Fonts CSS response.");
  }

  try {
    for (const fontUrl of fontUrls) {
      const fontResponse = await fetch(fontUrl);
      if (!fontResponse.ok) {
        throw new Error(`Google Fonts file request failed with HTTP ${fontResponse.status}.`);
      }
      const font = Buffer.from(await fontResponse.arrayBuffer());
      css = css.replaceAll(fontUrl, `data:font/woff2;base64,${font.toString("base64")}`);
    }

    const assetFontCss = css.replaceAll(
      "font-family: 'Noto Sans KR';",
      `font-family: "${assetFontFamily}";`,
    );
    await mkdir(path.dirname(assetFontCachePath), { recursive: true });
    await writeFile(assetFontCachePath, assetFontCss);
    return assetFontCss;
  } catch (error) {
    throw new Error(
      `Could not download Noto Sans KR from Google Fonts. Re-run with network access or provide the cached font CSS at ${assetFontCachePath}.`,
      { cause: error },
    );
  }
}

async function installAssetFont(page, assetFontCss) {
  // Inject the cached font CSS directly into the page so screenshots do not
  // depend on OS-installed fonts or external network timing during capture.
  await page.addStyleTag({ content: assetFontCss });
  await page.evaluate(
    ({ fontFamily, sampleText }) => document.fonts.load(`900 100px "${fontFamily}"`, sampleText),
    { fontFamily: assetFontFamily, sampleText: assetFontLoadSampleText },
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

function assertPngDimensions(buffer, { fileName, width, height }) {
  const pngSignature = "89504e470d0a1a0a";
  if (!Buffer.isBuffer(buffer) || buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error(`${fileName} was not generated as a PNG file.`);
  }

  const actualWidth = buffer.readUInt32BE(16);
  const actualHeight = buffer.readUInt32BE(20);
  if (actualWidth !== width || actualHeight !== height) {
    throw new Error(
      `${fileName} must be ${width}x${height}px, generated ${actualWidth}x${actualHeight}px.`,
    );
  }
}

function assertIcoDimensions(buffer, { fileName, sizes }) {
  if (buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) {
    throw new Error(`${fileName} was not generated as an ICO file.`);
  }

  const entryCount = buffer.readUInt16LE(4);
  if (entryCount !== sizes.length) {
    throw new Error(`${fileName} must contain ${sizes.length} images, generated ${entryCount}.`);
  }

  sizes.forEach((size, index) => {
    const offset = 6 + index * 16;
    const actualWidth = buffer.readUInt8(offset) || 256;
    const actualHeight = buffer.readUInt8(offset + 1) || 256;
    if (actualWidth !== size || actualHeight !== size) {
      throw new Error(
        `${fileName} entry ${index + 1} must be ${size}x${size}px, generated ${actualWidth}x${actualHeight}px.`,
      );
    }
  });
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
