#!/usr/bin/env node
/*
 * generate-og-image.mjs — chunk: spa-launch-readiness-seo-2026-05-09.
 *
 * Produces /public/og-image.jpg — the 1200x630 global og:image / twitter:image
 * referenced by index.html. Wired to `npm run og:generate` (see package.json).
 *
 * Source-of-truth path (default mode):
 *   design/og-candidates/01-winner-clean-editorial.png
 *
 * The PNGs in `design/og-candidates/` are the AI-generated source candidates
 * (see that directory's README.md for the ranking). The shipped JPEG is a
 * derived artifact; do not hand-edit `public/og-image.jpg` — re-run this
 * script instead.
 *
 * Modes:
 *   1) DEFAULT (no flags): convert the operator-approved photo at
 *      `design/og-candidates/01-winner-clean-editorial.png` to a 1200x630
 *      JPEG. Cover-crop is anchored LEFT+BOTTOM so the lower-left negative
 *      space (where social previews overlay text) is preserved.
 *   2) `--source <path-to-image>`: same conversion against an arbitrary
 *      source image (e.g. a future replacement candidate).
 *   3) `--bridge`: regenerate the typographic bridge card (cream background,
 *      "Mukyala" wordmark, "Licensed esthetician facials. Carlsbad." tagline)
 *      as a fallback if the photo asset is ever lost.
 *
 * Output budget:
 *   Hard cap 300 KB. Encoder steps the JPEG quality down 85 -> 80 -> 75 to
 *   try to fit; throws if even quality 75 exceeds 300 KB (we don't drop below
 *   75 — visible artifacts undermine the brand). Override starting quality
 *   with `--quality N`.
 *
 * jimp 1.x is already a devDep, so this script has no extra install cost.
 *
 * Run:
 *   `npm run og:generate`                    # default — photo conversion
 *   `npm run og:generate -- --bridge`        # regen typographic bridge
 *   `npm run og:generate -- --source <png>`  # arbitrary source
 *   `npm run og:generate -- --quality 80`    # lower JPEG starting quality
 */

import { Jimp, loadFont, HorizontalAlign, VerticalAlign } from 'jimp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(REPO_ROOT, 'public', 'og-image.jpg');
const DEFAULT_PHOTO_SOURCE = resolve(
  REPO_ROOT,
  'design',
  'og-candidates',
  '01-winner-clean-editorial.png',
);

const WIDTH = 1200;
const HEIGHT = 630;

// Solid warm cream background (closest to the operator's brand cream that we
// can express as a single 32-bit RGBA literal). #F5EDE0 -> 0xF5EDE0FF.
const CREAM_RGBA = 0xf5ede0ff;
// Slightly darker cream for the hairline border.
const BORDER_RGBA = 0xe7d8b8ff;

const FONT_DIR =
  'node_modules/@jimp/plugins/node_modules/@jimp/plugin-print/fonts/open-sans';
const TITLE_FONT_PATH = resolve(
  REPO_ROOT,
  FONT_DIR,
  'open-sans-128-black',
  'open-sans-128-black.fnt',
);
const TAGLINE_FONT_PATH = resolve(
  REPO_ROOT,
  FONT_DIR,
  'open-sans-32-black',
  'open-sans-32-black.fnt',
);

function parseArgs(argv) {
  const args = { mode: 'photo', source: null, quality: 85 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--bridge') args.mode = 'bridge';
    else if (a === '--source') {
      args.mode = 'photo';
      args.source = argv[++i];
    } else if (a === '--quality') {
      args.quality = Number(argv[++i]);
    }
  }
  return args;
}

async function renderPhoto(sourcePath, quality) {
  const image = await Jimp.read(sourcePath);
  // Cover-crop anchored LEFT+BOTTOM so the lower-left text-overlay zone is
  // preserved (the operator-approved winner places empty negative space in
  // the lower-left for social-card text overlays).
  image.cover({
    w: WIDTH,
    h: HEIGHT,
    align: HorizontalAlign.LEFT | VerticalAlign.BOTTOM,
  });
  return tryEncode(image, quality);
}

// Encode at the requested JPEG quality, then step down (85 -> 80 -> 75) if the
// 300 KB social-card budget is exceeded. Bail out below 75 — visible artifacts
// would undermine the brand's luxury positioning.
async function tryEncode(image, startingQuality) {
  const ladder = [startingQuality, 80, 75].filter(
    (q, idx, arr) => q >= 75 && arr.indexOf(q) === idx,
  );
  let buffer;
  let usedQuality = ladder[0];
  for (const q of ladder) {
    buffer = await image.getBuffer('image/jpeg', { quality: q });
    usedQuality = q;
    if (buffer.length <= 300 * 1024) break;
  }
  if (buffer.length > 300 * 1024) {
    throw new Error(
      `JPEG output ${buffer.length} bytes exceeds 300KB budget at quality ${usedQuality}; will not drop below 75.`,
    );
  }
  return { buffer, usedQuality };
}

async function renderBridge(quality) {
  // Solid cream canvas.
  const image = new Jimp({ width: WIDTH, height: HEIGHT, color: CREAM_RGBA });

  // Hairline inset border. Draw four 1px lines via scan + setPixelColor.
  const inset = 40;
  for (let x = inset; x < WIDTH - inset; x += 1) {
    image.setPixelColor(BORDER_RGBA, x, inset);
    image.setPixelColor(BORDER_RGBA, x, HEIGHT - inset - 1);
  }
  for (let y = inset; y < HEIGHT - inset; y += 1) {
    image.setPixelColor(BORDER_RGBA, inset, y);
    image.setPixelColor(BORDER_RGBA, WIDTH - inset - 1, y);
  }

  // Wordmark + tagline. jimp's `print` accepts a font, x/y bounds box, and
  // text/alignment. Using vertical/horizontal align center for the title row,
  // then a second print() for the tagline.
  const titleFont = await loadFont(TITLE_FONT_PATH);
  const taglineFont = await loadFont(TAGLINE_FONT_PATH);

  // Title sits slightly above center; tagline sits below.
  const titleBoxHeight = 180;
  const titleTop = Math.round(HEIGHT / 2 - titleBoxHeight / 2 - 30);
  image.print({
    font: titleFont,
    x: 0,
    y: titleTop,
    text: {
      text: 'Mukyala',
      alignmentX: HorizontalAlign.CENTER,
      alignmentY: VerticalAlign.MIDDLE,
    },
    maxWidth: WIDTH,
    maxHeight: titleBoxHeight,
  });

  const taglineBoxHeight = 60;
  const taglineTop = titleTop + titleBoxHeight + 20;
  image.print({
    font: taglineFont,
    x: 0,
    y: taglineTop,
    text: {
      text: 'Licensed esthetician facials. Carlsbad.',
      alignmentX: HorizontalAlign.CENTER,
      alignmentY: VerticalAlign.MIDDLE,
    },
    maxWidth: WIDTH,
    maxHeight: taglineBoxHeight,
  });

  // Flat typographic card compresses tiny — quality 80 stays well under 300KB.
  return tryEncode(image, Math.min(quality, 80));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourcePath =
    args.mode === 'photo' ? (args.source ?? DEFAULT_PHOTO_SOURCE) : null;

  const { buffer, usedQuality } =
    args.mode === 'bridge'
      ? await renderBridge(args.quality)
      : await renderPhoto(sourcePath, args.quality);

  const fs = await import('node:fs/promises');
  await fs.writeFile(OUTPUT_PATH, buffer);

  const sourceLabel =
    args.mode === 'bridge'
      ? 'typographic-bridge'
      : `photo<-${sourcePath.replace(REPO_ROOT + '/', '')}`;
  console.log(
    `[generate-og-image] wrote ${OUTPUT_PATH} (${buffer.length} bytes, ${WIDTH}x${HEIGHT}, quality=${usedQuality}, source=${sourceLabel})`,
  );
}

main().catch((err) => {
  console.error('[generate-og-image] failed:', err);
  process.exit(1);
});
