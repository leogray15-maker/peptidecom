// Unit tests for the product scoring engine (src/lib/product-score.ts).
// Run with: npm run test:product-score
import assert from "node:assert/strict";
import {
  analyzeIngredients,
  normalizeOffProduct,
  scoreBand,
} from "../src/lib/product-score";

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

console.log("Product scoring engine");

test("empty ingredient text is flagged empty with score 0", () => {
  const a = analyzeIngredients("");
  assert.equal(a.empty, true);
  assert.equal(a.ingredientCount, 0);
});

test("a clean barrier cream scores Excellent", () => {
  const a = analyzeIngredients(
    "Aqua, Glycerin, Cetearyl Alcohol, Ceramide NP, Niacinamide, Dimethicone, Panthenol, Petrolatum"
  );
  assert.ok(a.score >= 75, `expected Excellent, got ${a.score}`);
  assert.equal(a.band.label, "Excellent");
  assert.equal(a.negatives.length, 0);
  assert.ok(a.positives.length >= 4);
});

test("fragrance + MI/MCI high in the list tanks the score", () => {
  const a = analyzeIngredients(
    "Aqua, Parfum, Methylisothiazolinone, Limonene, Linalool, Sodium Lauryl Sulfate"
  );
  assert.ok(a.score <= 45, `expected Poor/Bad, got ${a.score}`);
  assert.ok(["Poor", "Bad"].includes(a.band.label));
  assert.ok(a.negatives.some((n) => n.name.includes("Fragrance")));
});

test("position matters: fragrance near the end penalises less than near the top", () => {
  const top = analyzeIngredients("Parfum, Aqua, Glycerin, Caprylic Triglyceride, Butylene Glycol, Tocopherol, Xanthan Gum");
  const base = analyzeIngredients("Aqua, Glycerin, Caprylic Triglyceride, Butylene Glycol, Tocopherol, Xanthan Gum, Parfum");
  assert.ok(top.score < base.score, `top ${top.score} should be < base ${base.score}`);
});

test("more severe irritants remove more points", () => {
  const a = analyzeIngredients("Aqua, Methylisothiazolinone"); // severity 3
  const b = analyzeIngredients("Aqua, Phenoxyethanol"); // severity 1
  const an = a.negatives.find((n) => n.name.includes("Methylisothiazolinone"))!;
  const bn = b.negatives.find((n) => n.name.includes("Phenoxyethanol"))!;
  assert.ok(an.penalty > bn.penalty);
});

test("breakdown tags every ingredient flag / good / neutral in order", () => {
  const a = analyzeIngredients("Aqua, Glycerin, Parfum");
  assert.equal(a.breakdown.length, 3);
  assert.equal(a.breakdown[0].tag, "neutral"); // Aqua
  assert.equal(a.breakdown[1].tag, "good"); // Glycerin
  assert.equal(a.breakdown[2].tag, "flag"); // Parfum
});

test("bands map to the right labels and tones", () => {
  assert.equal(scoreBand(90).label, "Excellent");
  assert.equal(scoreBand(60).label, "Good");
  assert.equal(scoreBand(30).label, "Poor");
  assert.equal(scoreBand(10).label, "Bad");
});

console.log("\nOpen Beauty Facts normaliser");

test("normalises a found product", () => {
  const p = normalizeOffProduct(
    "3337875597197",
    {
      status: 1,
      product: {
        product_name: "Lipikar Baume AP+M",
        brands: "La Roche-Posay",
        image_front_small_url: "https://img/xyz.jpg",
        ingredients_text: "Aqua, Glycerin, Niacinamide",
      },
    },
    "openbeautyfacts"
  );
  assert.equal(p.found, true);
  assert.equal(p.name, "Lipikar Baume AP+M");
  assert.equal(p.brand, "La Roche-Posay");
  assert.equal(p.imageUrl, "https://img/xyz.jpg");
  assert.equal(p.ingredientsText, "Aqua, Glycerin, Niacinamide");
});

test("falls back to the parsed ingredients array when text is missing", () => {
  const p = normalizeOffProduct(
    "123",
    {
      status: 1,
      product: {
        product_name: "Mystery Cream",
        ingredients: [{ text: "Aqua" }, { text: "Glycerin" }, { text: "Parfum" }],
      },
    },
    "openbeautyfacts"
  );
  assert.equal(p.ingredientsText, "Aqua, Glycerin, Parfum");
});

test("marks a not-found product", () => {
  const p = normalizeOffProduct("000", { status: 0 }, "openbeautyfacts");
  assert.equal(p.found, false);
  assert.equal(p.name, null);
});

console.log(`\n${passed} product-score tests passed.\n`);
