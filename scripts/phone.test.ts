// Unit tests for phone normalization (src/lib/phone.ts).
// Run with: npm run test:phone
//
// The point of storing a number at all is being able to ring the person weeks
// later, so the cases that matter are the ones where a number would be saved
// in a shape nobody can dial: a national number with no country code, or junk
// that sailed through the form because it happened to contain digits.
import assert from "node:assert/strict";
import { formatPhone, isValidPhone, normalizePhone } from "../src/lib/phone";

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

console.log("\nPhone numbers\n");

test("keeps an E.164 number as-is", () => {
  assert.equal(normalizePhone("+447700900123"), "+447700900123");
});

test("strips spaces, brackets and dashes", () => {
  assert.equal(normalizePhone("+44 (0)7700 900-123"), "+447700900123");
  assert.equal(normalizePhone("+1 (415) 555-0123"), "+14155550123");
});

test("converts a 00 international prefix to +", () => {
  assert.equal(normalizePhone("0044 7700 900123"), "+447700900123");
});

test("assumes the default country for a national number", () => {
  assert.equal(normalizePhone("07700 900123"), "+447700900123");
  assert.equal(normalizePhone("7700900123"), "+447700900123");
});

test("drops a bracketed trunk 0 written for domestic diallers", () => {
  assert.equal(normalizePhone("+44 (0) 7700 900123"), "+447700900123");
});

test("keeps a foreign country code the member typed", () => {
  assert.equal(normalizePhone("+1 415 555 0123"), "+14155550123");
  assert.equal(normalizePhone("+61 412 345 678"), "+61412345678");
});

test("rejects anything that isn't dialable", () => {
  for (const bad of [
    "",
    "   ",
    null,
    undefined,
    "n/a",
    "call me",
    "123", // too short even with a country code
    "0",
    "+0123456789", // no country code starts with 0
    "+1234567890123456", // longer than E.164 allows
  ]) {
    assert.equal(normalizePhone(bad as string), null, `expected ${String(bad)} to be rejected`);
  }
});

test("isValidPhone mirrors normalization", () => {
  assert.equal(isValidPhone("07700 900123"), true);
  assert.equal(isValidPhone("nope"), false);
});

test("formats for display without mangling foreign numbers", () => {
  assert.equal(formatPhone("07700900123"), "+44 7700 900123");
  assert.equal(formatPhone("+14155550123"), "+14155550123");
  assert.equal(formatPhone(null), "");
});

console.log(`\n${passed} passed\n`);
