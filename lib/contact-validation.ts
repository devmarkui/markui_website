/**
 * The rules for the email and phone fields on the enquiry forms.
 *
 * Both forms check these as the visitor types, and `submitEnquiry` checks the
 * same functions again on the server — a Server Action can be called directly,
 * so the browser's opinion is a convenience, never the guard. Keeping one copy
 * means the two can't drift apart and start disagreeing about what is valid.
 */

/** Deliberately loose: one @, a dot in the domain, no spaces. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Digits, with the punctuation people write numbers with, and a leading +. */
const PHONE_SHAPE_RE = /^\+?[\d\s().-]+$/;

/** E.164 allows 15 digits at most; 7 is the shortest national number in use. */
const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;

/**
 * Why this email is unacceptable, or null when it is fine.
 * An empty value returns null — whether it is *required* is the form's call,
 * since the contact form takes either an email or a phone number.
 */
export function emailError(value: string): string | null {
  const email = value.trim();
  if (!email) return null;
  if (!EMAIL_RE.test(email)) return "Enter a valid email, like name@company.com";
  return null;
}

/** Why this phone number is unacceptable, or null when it is fine. */
export function phoneError(value: string): string | null {
  const phone = value.trim();
  if (!phone) return null;
  if (!PHONE_SHAPE_RE.test(phone)) return "Use digits only, with an optional + first";

  const digits = phone.replace(/\D/g, "");
  if (digits.length < PHONE_MIN_DIGITS) return "That number looks too short";
  if (digits.length > PHONE_MAX_DIGITS) return "That number looks too long";
  return null;
}
