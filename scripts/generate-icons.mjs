// Generates the app icons from the same mark the in-app <Logo /> renders:
// the lucide "activity" pulse in white on the brand violet gradient.
//
// Run by hand after changing the mark, then commit the PNGs:
//   node scripts/generate-icons.mjs
//
// Deliberately dependency-free (zlib + a hand-rolled PNG writer) so the icons
// are checked-in bytes rather than something the Vercel build has to produce.
// Icons are full-bleed and opaque on purpose: iOS applies its own squircle
// mask to apple-touch-icon, so a pre-rounded or transparent source shows up as
// a shrunken tile with black corners on the home screen.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// brand-400 → brand-700 (tailwind.config.ts), the same stops as
// `bg-gradient-to-br from-brand-400 to-brand-700`.
const FROM = [0x9a, 0x7b, 0xff];
const TO = [0x5a, 0x33, 0xda];

// lucide "activity": M22 12h-4l-3 9L9 3l-3 9H2, in a 24x24 viewBox.
const GLYPH = [
  [22, 12], [18, 12], [15, 21], [9, 3], [6, 12], [2, 12],
];
const VIEWBOX = 24;
const STROKE = 2; // viewBox units, matches lucide's stroke-width
const GLYPH_SCALE = 0.62; // fraction of the icon the 24-unit box spans
const SUPERSAMPLE = 3;

/** Shortest distance from p to segment ab. Using this as the whole coverage
 * test gives round caps and round joins for free, which is what lucide uses. */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function render(size) {
  const scale = (size * GLYPH_SCALE) / VIEWBOX;
  const offset = (size - VIEWBOX * scale) / 2;
  const pts = GLYPH.map(([x, y]) => [offset + x * scale, offset + y * scale]);
  const radius = (STROKE * scale) / 2;

  // Raw RGB, no alpha — opaque icons avoid the black-corner artefact on iOS.
  const rgb = Buffer.alloc(size * size * 3);
  const step = 1 / SUPERSAMPLE;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Gradient runs top-left → bottom-right, like `bg-gradient-to-br`.
      const t = (x + y) / (2 * (size - 1));
      const bg = [
        Math.round(FROM[0] + (TO[0] - FROM[0]) * t),
        Math.round(FROM[1] + (TO[1] - FROM[1]) * t),
        Math.round(FROM[2] + (TO[2] - FROM[2]) * t),
      ];

      // Supersampled coverage of the stroke, for antialiased edges.
      let hits = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const px = x + (sx + 0.5) * step;
          const py = y + (sy + 0.5) * step;
          let min = Infinity;
          for (let i = 0; i < pts.length - 1; i++) {
            const d = distToSegment(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
            if (d < min) min = d;
          }
          if (min <= radius) hits++;
        }
      }

      const cov = hits / (SUPERSAMPLE * SUPERSAMPLE);
      const o = (y * size + x) * 3;
      for (let c = 0; c < 3; c++) {
        rgb[o + c] = Math.round(bg[c] + (255 - bg[c]) * cov);
      }
    }
  }
  return rgb;
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = truecolour RGB
  // 10..12: deflate / adaptive filtering / no interlace, all zero

  // Each scanline is prefixed with filter type 0 (None).
  const stride = size * 3;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  // Next file conventions — these emit the <link rel="icon"> / apple-touch-icon.
  ["src/app/icon.png", 256],
  ["src/app/apple-icon.png", 180],
  // Referenced by src/app/manifest.ts for Android / installed PWAs.
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
];

for (const [rel, size] of targets) {
  const png = encodePng(size, render(size));
  writeFileSync(join(root, rel), png);
  console.log(`${rel}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} KB`);
}
