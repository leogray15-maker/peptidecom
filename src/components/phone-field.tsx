"use client";

import { DEFAULT_DIAL_CODE, PHONE_INPUT_MAX, formatPhone, normalizePhone } from "@/lib/phone";

/**
 * Phone input shared by signup and settings.
 *
 * Shows the number back in the exact form it will be stored in. That preview is
 * the whole point: national numbers are assumed to be `+{DEFAULT_DIAL_CODE}`,
 * and someone abroad needs to see that guess happen so they can correct it
 * before the number is saved in a shape nobody can dial.
 */
export function PhoneField({
  value,
  onChange,
  id = "phone",
  label = "Mobile number",
  hint = "So we can reach you about your order or payment — nothing else.",
  required = true,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const typed = value.trim();
  const normalized = normalizePhone(typed);
  const invalid = typed.length > 0 && !normalized;

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="tel"
        inputMode="tel"
        required={required}
        maxLength={PHONE_INPUT_MAX}
        disabled={disabled}
        className="input"
        placeholder={`+${DEFAULT_DIAL_CODE} 7700 900123`}
        autoComplete="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
        {invalid ? (
          <span className="text-red-400">
            That doesn&apos;t look like a phone number — include your country code, e.g. +
            {DEFAULT_DIAL_CODE} 7700 900123.
          </span>
        ) : normalized ? (
          <>
            We&apos;ll save this as{" "}
            <span className="text-slate-300">{formatPhone(normalized)}</span> — change it if
            that country code is wrong.
          </>
        ) : (
          hint
        )}
      </p>
    </div>
  );
}
