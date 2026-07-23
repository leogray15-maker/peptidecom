// Unit tests for the POEM calculator (src/lib/poem.ts).
// Run with: npm run test:poem
import assert from "node:assert/strict";
import {
  POEM_QUESTIONS,
  emptyPoemAnswers,
  poemBand,
  poemComplete,
  poemScore,
} from "../src/lib/poem";

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

console.log("POEM calculator");

test("has the seven validated items", () => {
  assert.equal(POEM_QUESTIONS.length, 7);
});

test("empty answers score 0 and are incomplete", () => {
  const a = emptyPoemAnswers();
  assert.equal(poemScore(a), 0);
  assert.equal(poemComplete(a), false);
});

test("all 'every day' scores the max of 28", () => {
  const a = Object.fromEntries(POEM_QUESTIONS.map((q) => [q.id, 4]));
  assert.equal(poemScore(a), 28);
  assert.equal(poemComplete(a), true);
});

test("mixed answers sum correctly", () => {
  const a = {
    itch: 4,
    sleep: 3,
    bleeding: 0,
    weeping: 1,
    cracking: 2,
    flaking: 2,
    dryness: 4,
  };
  assert.equal(poemScore(a), 16);
});

test("unanswered questions count as 0", () => {
  const a = emptyPoemAnswers();
  a.itch = 4;
  assert.equal(poemScore(a), 4);
});

test("severity bands follow the standard strata", () => {
  assert.equal(poemBand(0).label, "Clear / almost clear");
  assert.equal(poemBand(2).label, "Clear / almost clear");
  assert.equal(poemBand(5).label, "Mild");
  assert.equal(poemBand(12).label, "Moderate");
  assert.equal(poemBand(20).label, "Severe");
  assert.equal(poemBand(26).label, "Very severe");
});

console.log(`\n${passed} POEM tests passed.\n`);
