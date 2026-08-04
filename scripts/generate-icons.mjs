// Generates the app icons from the same mark the in-app <Logo /> renders: the
// Arcane sigil with the tracker pulse line under it, in white on the brand
// violet gradient. The geometry comes from src/lib/mark.mjs, so the icons and
// the in-app logo cannot drift apart.
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
import {
  MARK_VIEWBOX,
  PULSE_OPACITY,
  PULSE_POINTS,
  PULSE_STROKE,
  SIGIL_PATH,
} from "../src/lib/mark.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// brand-400 → brand-700 (tailwind.config.ts), the same stops as
// `bg-gradient-to-br from-brand-400 to-brand-700`.
const FROM = [0x9a, 0x7b, 0xff];
const TO = [0x5a, 0x33, 0xda];

const MARK_SCALE = 0.76; // fraction of the icon the 128-unit mark box spans
const SUBSAMPLE = 4; // sample rows per pixel row
const CURVE_STEPS = 64; // line segments each bezier is flattened into

/** Parses the subset of SVG path syntax src/lib/mark.mjs uses — absolute
 * M/L/C/Q/Z — into closed polygons, flattening the curves. */
function flattenPath(d) {
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+/gi) ?? [];
  const points = [];
  let i = 0;
  let cur = [0, 0];

  const num = () => Number(tokens[i++]);
  const push = (p) => {
    points.push(p);
    cur = p;
  };
  /** Samples a bezier of any order via de Casteljau on its control points. */
  const curve = (ctrl) => {
    for (let s = 1; s <= CURVE_STEPS; s++) {
      const t = s / CURVE_STEPS;
      let pts = ctrl;
      while (pts.length > 1) {
        const next = [];
        for (let k = 0; k < pts.length - 1; k++) {
          next.push([
            pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t,
            pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t,
          ]);
        }
        pts = next;
      }
      push(pts[0]);
    }
  };

  while (i < tokens.length) {
    const cmd = tokens[i++];
    switch (cmd) {
      case "M":
      case "L":
        push([num(), num()]);
        break;
      case "Q":
        curve([cur, [num(), num()], [num(), num()]]);
        break;
      case "C":
        curve([cur, [num(), num()], [num(), num()], [num(), num()]]);
        break;
      case "Z":
        break; // polygons are implicitly closed by the scanline fill
      default:
        throw new Error(`unsupported path command: ${cmd}`);
    }
  }
  return points;
}

/** Even-odd scanline fill of the sigil's polygons into a coverage buffer.
 * Vertical antialiasing comes from the subsampled rows, horizontal from the
 * exact overlap of each inside-span with each pixel. */
function fillSigil(cov, size, project) {
  const edges = [];
  for (const d of SIGIL_PATH) {
    const poly = flattenPath(d).map(project);
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k];
      const b = poly[(k + 1) % poly.length];
      if (a[1] !== b[1]) edges.push([a, b]);
    }
  }

  const weight = 1 / SUBSAMPLE;
  const xs = [];
  for (let row = 0; row < size * SUBSAMPLE; row++) {
    const y = (row + 0.5) / SUBSAMPLE;
    xs.length = 0;
    for (const [a, b] of edges) {
      // Half-open in y so a vertex shared by two edges counts exactly once.
      if (y >= Math.min(a[1], b[1]) && y < Math.max(a[1], b[1])) {
        xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
    }
    if (xs.length < 2) continue;
    xs.sort((p, q) => p - q);

    const base = Math.floor(y) * size;
    for (let s = 0; s + 1 < xs.length; s += 2) {
      const from = Math.max(0, xs[s]);
      const to = Math.min(size, xs[s + 1]);
      for (let x = Math.floor(from); x < to; x++) {
        const overlap = Math.min(to, x + 1) - Math.max(from, x);
        if (overlap > 0) cov[base + x] += overlap * weight;
      }
    }
  }
}

/** Shortest distance from p to segment ab. Using this as the whole coverage
 * test gives the pulse round caps and round joins for free. */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Supersampled coverage of the stroked pulse polyline. */
function strokePulse(cov, size, project, radius) {
  const pts = PULSE_POINTS.map(project);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x - radius);
    maxX = Math.max(maxX, x + radius);
    minY = Math.min(minY, y - radius);
    maxY = Math.max(maxY, y + radius);
  }

  const step = 1 / SUBSAMPLE;
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(size, Math.ceil(maxY));
  const x0 = Math.max(0, Math.floor(minX));
  const x1 = Math.min(size, Math.ceil(maxX));

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      let hits = 0;
      for (let sy = 0; sy < SUBSAMPLE; sy++) {
        for (let sx = 0; sx < SUBSAMPLE; sx++) {
          const px = x + (sx + 0.5) * step;
          const py = y + (sy + 0.5) * step;
          for (let k = 0; k < pts.length - 1; k++) {
            const d = distToSegment(px, py, pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]);
            if (d <= radius) {
              hits++;
              break;
            }
          }
        }
      }
      if (hits) cov[y * size + x] = hits / (SUBSAMPLE * SUBSAMPLE);
    }
  }
}

function render(size) {
  const scale = (size * MARK_SCALE) / MARK_VIEWBOX;
  const offset = (size - MARK_VIEWBOX * scale) / 2;
  const project = ([x, y]) => [offset + x * scale, offset + y * scale];

  const sigil = new Float32Array(size * size);
  const pulse = new Float32Array(size * size);
  fillSigil(sigil, size, project);
  strokePulse(pulse, size, project, (PULSE_STROKE * scale) / 2);

  // Raw RGB, no alpha — opaque icons avoid the black-corner artefact on iOS.
  const rgb = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Gradient runs top-left → bottom-right, like `bg-gradient-to-br`.
      const t = (x + y) / (2 * (size - 1));
      const i = y * size + x;
      const marks = [
        Math.min(1, sigil[i]),
        Math.min(1, pulse[i]) * PULSE_OPACITY,
      ];

      const o = i * 3;
      for (let c = 0; c < 3; c++) {
        let v = FROM[c] + (TO[c] - FROM[c]) * t;
        for (const a of marks) v += (255 - v) * a;
        rgb[o + c] = Math.round(v);
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
