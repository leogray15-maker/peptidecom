// Unit tests for the membership access rules (src/lib/membership.ts).
// Run with: npm run test:membership
//
// These are the rules that decide who gets into the member area, so the cases
// that matter are the unhappy ones: a cancellation or a failed renewal that
// never reached us must not leave someone with access forever, and a member
// mid-renewal must not be locked out of what they've paid for.
import assert from "node:assert/strict";
import {
  RENEWAL_GRACE_MS,
  hasAccess,
  isActiveStatus,
  isLapsed,
  isMember,
  isStaff,
} from "../src/lib/membership";

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

const NOW = new Date("2026-06-01T12:00:00Z").getTime();
const hours = (n: number) => new Date(NOW + n * 60 * 60 * 1000);
const days = (n: number) => new Date(NOW + n * 24 * 60 * 60 * 1000);

console.log("Membership access rules");

test("a paid-up member is in", () => {
  assert.equal(
    isMember({ subscriptionStatus: "ACTIVE", stripeCurrentPeriodEnd: days(20) }, NOW),
    true
  );
});

test("a trialing member is in", () => {
  assert.equal(
    isMember({ subscriptionStatus: "TRIALING", stripeCurrentPeriodEnd: days(7) }, NOW),
    true
  );
});

test("cancelled and past-due are out, whatever the date says", () => {
  assert.equal(
    isMember({ subscriptionStatus: "CANCELED", stripeCurrentPeriodEnd: days(20) }, NOW),
    false
  );
  assert.equal(
    isMember({ subscriptionStatus: "PAST_DUE", stripeCurrentPeriodEnd: days(20) }, NOW),
    false
  );
  assert.equal(isMember({ subscriptionStatus: "NONE" }, NOW), false);
  assert.equal(isMember({ subscriptionStatus: "INCOMPLETE" }, NOW), false);
});

test("a renewal in flight keeps access through the grace window", () => {
  // Period ended an hour ago; Stripe's renewal webhook hasn't landed yet.
  assert.equal(isLapsed({ subscriptionStatus: "ACTIVE", stripeCurrentPeriodEnd: hours(-1) }, NOW), false);
  assert.equal(
    isMember({ subscriptionStatus: "ACTIVE", stripeCurrentPeriodEnd: hours(-1) }, NOW),
    true
  );
});

test("an ACTIVE row past the grace window is treated as lapsed", () => {
  // This is the cancellation-we-never-heard-about case: without the date check
  // the row says ACTIVE forever and access is never revoked.
  const stale = { subscriptionStatus: "ACTIVE" as const, stripeCurrentPeriodEnd: days(-3) };
  assert.equal(isLapsed(stale, NOW), true);
  assert.equal(isMember(stale, NOW), false);
  assert.equal(hasAccess({ ...stale, role: "MEMBER" }, NOW), false);
});

test("the grace window boundary falls where it should", () => {
  const justInside = new Date(NOW - RENEWAL_GRACE_MS + 1000);
  const justOutside = new Date(NOW - RENEWAL_GRACE_MS - 1000);
  assert.equal(isLapsed({ subscriptionStatus: "ACTIVE", stripeCurrentPeriodEnd: justInside }, NOW), false);
  assert.equal(isLapsed({ subscriptionStatus: "ACTIVE", stripeCurrentPeriodEnd: justOutside }, NOW), true);
});

test("a record with no period end never lapses (preview / comped accounts)", () => {
  assert.equal(isLapsed({ subscriptionStatus: "ACTIVE" }, NOW), false);
  assert.equal(isMember({ subscriptionStatus: "ACTIVE", stripeCurrentPeriodEnd: null }, NOW), true);
});

test("staff get in without a subscription, members don't", () => {
  const unpaid = { subscriptionStatus: "CANCELED" as const, stripeCurrentPeriodEnd: days(-30) };
  assert.equal(hasAccess({ ...unpaid, role: "ADMIN" }, NOW), true);
  assert.equal(hasAccess({ ...unpaid, role: "MODERATOR" }, NOW), true);
  assert.equal(hasAccess({ ...unpaid, role: "MEMBER" }, NOW), false);
  assert.equal(isStaff("MEMBER"), false);
});

test("nobody is signed out and still a member", () => {
  assert.equal(isMember(null), false);
  assert.equal(isMember(undefined), false);
  assert.equal(hasAccess(null), false);
});

test("isActiveStatus reads the status alone", () => {
  assert.equal(isActiveStatus("ACTIVE"), true);
  assert.equal(isActiveStatus("TRIALING"), true);
  assert.equal(isActiveStatus("PAST_DUE"), false);
  assert.equal(isActiveStatus(null), false);
});

console.log(`\n${passed} passed\n`);
