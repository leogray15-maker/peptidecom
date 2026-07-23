// Unit tests for the ingredient irritant checker (src/lib/irritants.ts).
// Run with: npm run test:irritants
import assert from "node:assert/strict";
import { parseIngredients, scanIngredients } from "../src/lib/irritants";

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

console.log("Ingredient irritant checker");

test("parses comma / newline / bullet separated lists", () => {
  const t = parseIngredients("Aqua, Glycerin\nParfum • Linalool");
  assert.equal(t.length, 4);
  assert.equal(t[0].raw, "Aqua");
  assert.equal(t[2].raw, "Parfum");
});

test("flags fragrance and named allergens", () => {
  const r = scanIngredients("Aqua, Glycerin, Parfum, Linalool, Limonene");
  const names = r.matches.map((m) => m.irritant.name);
  assert.ok(names.includes("Fragrance / parfum"));
  assert.ok(names.includes("Linalool"));
  assert.ok(names.includes("Limonene"));
});

test("flags MI/MCI preservatives", () => {
  const r = scanIngredients("Aqua, Methylisothiazolinone, Methylchloroisothiazolinone");
  assert.ok(r.matches.some((m) => m.irritant.category === "preservative"));
});

test("flags SLS and reports the ingredient that hit", () => {
  const r = scanIngredients("Aqua, Sodium Lauryl Sulfate, Cocamidopropyl Betaine");
  const sls = r.matches.find((m) => m.irritant.name.includes("Sodium lauryl"));
  assert.ok(sls);
  assert.ok(sls!.hits.some((h) => /lauryl/i.test(h)));
});

test("a clean list produces no matches", () => {
  const r = scanIngredients("Aqua, Glycerin, Petrolatum, Cetyl Alcohol, Dimethicone");
  // cetyl alcohol is a fatty alcohol and must NOT trip the drying-alcohol flag
  assert.equal(r.matches.length, 0);
  assert.equal(r.cleanCount, 5);
});

test("counts ingredients and clean remainder", () => {
  const r = scanIngredients("Aqua, Glycerin, Parfum");
  assert.equal(r.ingredientCount, 3);
  assert.equal(r.cleanCount, 2);
});

console.log(`\n${passed} irritant-checker tests passed.\n`);
