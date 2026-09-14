/**
 * Phone numbers, stored the one way that is useful later: E.164 (`+447700900123`).
 *
 * A number is only worth collecting if it can actually be dialled or texted
 * months after signup, so everything lands normalized — no spaces, no brackets,
 * no "07…" that works in one country and nowhere else.
 *
 * Numbers typed in national form (a leading trunk `0`, or bare digits) get
 * DEFAULT_DIAL_CODE prepended. That guess is wrong for a member dialling from
 * another country, so every form that uses this shows the normalized result
 * back to them before saving — a wrong country code is obvious on screen, and
 * invisible in the database.
 */

/** Dialling code assumed for national-format numbers. Pricing is in GBP, so UK. */
export const DEFAULT_DIAL_CODE =
  (process.env.NEXT_PUBLIC_DEFAULT_DIAL_CODE ?? "+44").replace(/\D/g, "") || "44";

/** Longest E.164 number is 15 digits; shortest usable one is ~8 with its code. */
const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

/** What a raw phone input is allowed to contain before we clean it up. */
export const PHONE_INPUT_MAX = 24;

/**
 * Clean a typed phone number into E.164, or null if it can't be one.
 *
 * Accepts `+44 7700 900123`, `0044 7700 900123`, `07700 900123`,
 * `(07700) 900-123` and `7700900123`.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Letters are never part of a number we can dial (and "call me on my mobile"
  // is not a phone number).
  if (/[a-z]/i.test(trimmed)) return null;

  // "+44 (0)7700 900123" — the bracketed trunk digit is there for people
  // dialling domestically and must not survive into the stored number.
  const digits = trimmed.replace(/\(\s*0\s*\)/g, "").replace(/\D/g, "");
  if (!digits) return null;

  let e164: string;
  if (trimmed.startsWith("+")) {
    e164 = digits;
  } else if (digits.startsWith("00")) {
    // International prefix used outside North America.
    e164 = digits.slice(2);
  } else {
    // National format: drop the trunk prefix and assume the default country.
    e164 = DEFAULT_DIAL_CODE + digits.replace(/^0+/, "");
  }

  if (e164.startsWith("0")) return null; // no country code starts with 0
  if (e164.length < MIN_DIGITS || e164.length > MAX_DIGITS) return null;
  return `+${e164}`;
}

/** True when the input is a number we'd be able to ring. */
export function isValidPhone(input: string | null | undefined): boolean {
  return normalizePhone(input) !== null;
}

/**
 * E.164 broken into readable groups for display — `+44 7700 900123`.
 *
 * Deliberately country-agnostic: the dialling code is split off and the rest is
 * grouped from the right, which reads correctly everywhere without pretending
 * to know each country's formatting rules.
 */
export function formatPhone(phone: string | null | undefined): string {
  const e164 = normalizePhone(phone);
  if (!e164) return phone?.trim() ?? "";

  const digits = e164.slice(1);
  const code = digits.slice(0, DEFAULT_DIAL_CODE.length);
  // Only split off a code we recognise; anything else stays whole.
  if (code !== DEFAULT_DIAL_CODE) return e164;

  const rest = digits.slice(DEFAULT_DIAL_CODE.length);
  if (rest.length <= 6) return `+${code} ${rest}`;
  return `+${code} ${rest.slice(0, rest.length - 6)} ${rest.slice(-6)}`;
}
