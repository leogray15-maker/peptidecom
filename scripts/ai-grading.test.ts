// Unit tests for AI Flare Grading compliance: consent versioning, model
// attributability, the non-skin gate, and a standing audit that diagnostic
// language hasn't crept back into the feature's strings.
// Run with: npm run test:ai-grading
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AI_ESTIMATE_LABEL,
  CONSENT_COPY,
  CONSENT_VERSION,
  HEURISTIC_MODEL_ID,
  LOCAL_MODEL_ID,
  MIN_SKIN_FRACTION,
  RETROACTIVE_RELABEL_POLICY,
  methodLabel,
  modelIdFor,
  needsConsent,
} from "../src/lib/ai-grading";
import {
  PHOTO_SCORE_VERSION,
  computePhotoFeatures,
  isLikelySkinPhoto,
} from "../src/lib/photo-score";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

// ─── consent versioning ──────────────────────────────────────────────────────

test("needsConsent: never consented, stale version, current version", () => {
  assert.equal(needsConsent(null), true);
  assert.equal(needsConsent(undefined), true);
  assert.equal(
    needsConsent({ version: CONSENT_VERSION - 1, acceptedAt: "2026-01-01T00:00:00.000Z" }),
    true,
    "a version bump must re-prompt"
  );
  assert.equal(
    needsConsent({ version: CONSENT_VERSION, acceptedAt: "2026-01-01T00:00:00.000Z" }),
    false
  );
  assert.equal(
    needsConsent({ version: CONSENT_VERSION + 1, acceptedAt: "2026-01-01T00:00:00.000Z" }),
    false,
    "a newer stored version is ahead, not stale — don't re-prompt"
  );
});

test("consent copy states the three things it has to state", () => {
  const all = [CONSENT_COPY.intro, ...CONSENT_COPY.points].join(" ").toLowerCase();
  assert.ok(all.includes("estimate"), "must say it is an estimate");
  assert.ok(all.includes("not a diagnosis"), "must say it is not a diagnosis");
  assert.ok(
    all.includes("does not replace a clinician") || all.includes("replace"),
    "must say it does not replace a clinician"
  );
  // The affirmative action must read as an action, not a dismissal.
  assert.ok(/i understand/i.test(CONSENT_COPY.acceptLabel));
});

test("historical gradings keep the version they were made under", () => {
  assert.equal(RETROACTIVE_RELABEL_POLICY, "historical-labels-preserved");
});

// ─── model attributability ───────────────────────────────────────────────────

test("modelIdFor: identifies each method and carries the version", () => {
  assert.equal(modelIdFor("heuristic", 1), `${HEURISTIC_MODEL_ID}@1`);
  assert.equal(modelIdFor("tfjs", 1, 2), `${LOCAL_MODEL_ID}@2`);
  assert.equal(modelIdFor("blended", 1, 3), `${HEURISTIC_MODEL_ID}@1+${LOCAL_MODEL_ID}@3`);
  // A score-version bump must change the stored identifier, or old gradings
  // become indistinguishable from new ones.
  assert.notEqual(modelIdFor("heuristic", 1), modelIdFor("heuristic", 2));
});

test("modelIdFor tracks the live PHOTO_SCORE_VERSION", () => {
  assert.ok(modelIdFor("heuristic", PHOTO_SCORE_VERSION).endsWith(`@${PHOTO_SCORE_VERSION}`));
});

test("methodLabel: plain English for every method", () => {
  for (const m of ["heuristic", "tfjs", "blended"] as const) {
    assert.ok(methodLabel(m).length > 0);
    assert.ok(!/tfjs|heuristic/i.test(methodLabel(m)), "no internal jargon in the UI label");
  }
});

// ─── non-skin gate ───────────────────────────────────────────────────────────

/** W×H RGBA buffer filled with one colour. */
function solid(w: number, h: number, [r, g, b]: [number, number, number]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return data;
}

const SKIN_TONES: [string, [number, number, number]][] = [
  ["very light", [245, 214, 195]],
  ["light", [224, 188, 160]],
  ["medium", [198, 148, 110]],
  ["olive", [172, 128, 92]],
  ["brown", [124, 82, 54]],
  ["deep brown", [82, 53, 36]],
  ["very deep", [56, 36, 26]],
  ["inflamed", [200, 70, 60]],
];

test("skin gate admits every skin tone, including deep ones", () => {
  for (const [name, rgb] of SKIN_TONES) {
    const f = computePhotoFeatures(solid(80, 80, rgb), 80, 80);
    assert.ok(
      isLikelySkinPhoto(f, MIN_SKIN_FRACTION),
      `${name} skin must not be rejected (skinFraction ${f.skinFraction.toFixed(2)})`
    );
  }
});

test("skin gate rejects the things people actually mis-upload", () => {
  const nonSkin: [string, [number, number, number]][] = [
    ["blue sky", [110, 160, 235]],
    ["grass", [80, 150, 60]],
    ["white screenshot", [250, 250, 252]],
    ["grey wall", [140, 140, 142]],
    ["teal packaging", [30, 170, 170]],
    ["purple label", [120, 60, 200]],
  ];
  for (const [name, rgb] of nonSkin) {
    const f = computePhotoFeatures(solid(80, 80, rgb), 80, 80);
    assert.equal(
      isLikelySkinPhoto(f, MIN_SKIN_FRACTION),
      false,
      `${name} must be rejected (skinFraction ${f.skinFraction.toFixed(2)})`
    );
  }
});

test("skinFraction is a fraction of usable pixels", () => {
  const f = computePhotoFeatures(solid(60, 60, [224, 188, 160]), 60, 60);
  assert.ok(f.skinFraction >= 0 && f.skinFraction <= 1);
});

// ─── standing string audit ───────────────────────────────────────────────────

/** Files that make up the AI Flare Grading feature's user-facing surface. */
const AUDITED = [
  "src/lib/ai-grading.ts",
  "src/lib/photo-score.ts",
  "src/components/grade-client.tsx",
  "src/components/flare-region-map.tsx",
  "src/components/ai-grading-consent.tsx",
  "src/components/ai-estimate-label.tsx",
  "src/app/(app)/grade/page.tsx",
];

/** Phrases that claim the tool identifies or evaluates a condition. Matched
 * case-insensitively against the feature's source. "not a diagnosis" and
 * "not diagnostic" are the point of the exercise, so they're exempted first. */
const BANNED = [
  /\bdiagnos(e|es|ing|is|tic)\b/i,
  /\bdetects?\b/i,
  /\bidentif(y|ies) your condition\b/i,
  /\bassess(es)? your condition\b/i,
  /more accurate than a (dermatologist|doctor|clinician)/i,
];

/** Strip comments — the audit is about what members read, and the rule itself
 * has to be allowed to name the words it bans. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

test("no diagnostic claims in the AI grading surface", () => {
  const root = join(__dirname, "..");
  const offenders: string[] = [];
  for (const file of AUDITED) {
    const src = stripComments(readFileSync(join(root, file), "utf8"))
      // Permitted disclaimers — these are the compliant framing, not a claim.
      .replace(/not a diagnosis/gi, "")
      .replace(/not diagnostic/gi, "")
      .replace(/never diagnos\w*/gi, "");
    for (const pattern of BANNED) {
      const hit = src.match(pattern);
      if (hit) offenders.push(`${file}: “${hit[0]}”`);
    }
  }
  assert.deepEqual(offenders, [], `diagnostic language found:\n${offenders.join("\n")}`);
});

test("the persistent label says both halves of the claim", () => {
  assert.ok(/estimate/i.test(AI_ESTIMATE_LABEL));
  assert.ok(/not a diagnosis/i.test(AI_ESTIMATE_LABEL));
});

console.log(`\n${passed} AI grading tests passed.`);
