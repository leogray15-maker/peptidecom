// Unit tests for the food/nutrition scoring engine (src/lib/food-score.ts).
// Run with: npm run test:food-score
import assert from "node:assert/strict";
import { analyzeFood, foodBand } from "../src/lib/food-score";
import type { ScannedProduct } from "../src/lib/product-score";

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

function food(partial: Partial<ScannedProduct>): ScannedProduct {
  return {
    code: "1",
    name: "Test food",
    brand: null,
    imageUrl: null,
    ingredientsText: null,
    source: "openfoodfacts",
    found: true,
    kind: "food",
    nutriscoreGrade: null,
    novaGroup: null,
    additives: [],
    organic: false,
    nutriments: null,
    ...partial,
  };
}

console.log("Food scoring engine");

test("bands map to labels", () => {
  assert.equal(foodBand(90).label, "Excellent");
  assert.equal(foodBand(60).label, "Good");
  assert.equal(foodBand(30).label, "Poor");
  assert.equal(foodBand(10).label, "Bad");
});

test("Nutri-Score A scores Excellent", () => {
  const a = analyzeFood(food({ nutriscoreGrade: "a" }));
  assert.ok(a.score >= 75, `got ${a.score}`);
  assert.equal(a.band.label, "Excellent");
});

test("Nutri-Score E scores Bad", () => {
  const a = analyzeFood(food({ nutriscoreGrade: "e" }));
  assert.ok(a.score < 25, `got ${a.score}`);
  assert.equal(a.band.label, "Bad");
});

test("builds per-100g negatives and positives with traffic-light levels", () => {
  const a = analyzeFood(
    food({
      nutriscoreGrade: "c",
      nutriments: {
        energyKcal: 250,
        sugars: 30, // high
        saturatedFat: 0.5, // low
        salt: 2, // high
        proteins: 10, // good
        fiber: 1, // low
        fruitsVegetables: 60, // good
      },
    })
  );
  const sugars = a.negatives.find((x) => x.id === "sugars")!;
  const satfat = a.negatives.find((x) => x.id === "satfat")!;
  const salt = a.negatives.find((x) => x.id === "salt")!;
  assert.equal(sugars.level, "bad");
  assert.equal(satfat.level, "good");
  assert.equal(salt.level, "bad");
  const protein = a.positives.find((x) => x.id === "protein")!;
  assert.equal(protein.level, "good");
});

test("risky additives lower the score and are named", () => {
  const clean = analyzeFood(food({ nutriscoreGrade: "b" }));
  const withAdditives = analyzeFood(food({ nutriscoreGrade: "b", additives: ["e102", "e621", "e330"] }));
  assert.ok(withAdditives.score < clean.score);
  assert.equal(withAdditives.additiveCount, 3);
  const tartrazine = withAdditives.additives.find((x) => x.code === "E102")!;
  assert.equal(tartrazine.risk, "high");
  const citric = withAdditives.additives.find((x) => x.code === "E330")!;
  assert.equal(citric.risk, "none");
});

test("falls back to nutriments when no Nutri-Score", () => {
  const a = analyzeFood(
    food({
      nutriments: {
        energyKcal: 500,
        sugars: 40,
        saturatedFat: 15,
        salt: 2,
        proteins: 3,
        fiber: 0.5,
        fruitsVegetables: 0,
      },
    })
  );
  assert.equal(a.hasData, true);
  assert.ok(a.score < 50, `an unhealthy product should score low, got ${a.score}`);
});

test("unknown additive defaults to limited risk", () => {
  const a = analyzeFood(food({ nutriscoreGrade: "b", additives: ["e9999"] }));
  assert.equal(a.additives[0].risk, "limited");
});

console.log(`\n${passed} food-score tests passed.\n`);
