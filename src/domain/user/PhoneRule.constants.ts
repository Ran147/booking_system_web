// Phone rule shared by every form that asks for a phone (KAN-123 AS-3,
// KAN-170, forms-validation-standards §6). Whether the field is required is
// up to each form; this rule only says whether a value is a valid phone.
export const PHONE_RULE = Object.freeze({
  // E.164 allows at most 15 digits.
  MAX_DIGITS: 15,
  MAX_LENGTH: 20,
  MIN_DIGITS: 7,
  PATTERN: Object.freeze({
    // Digits, spaces, "+", "-" and parentheses.
    ALLOWED_CHARACTERS: /^[0-9+() -]+$/,
    // Global: count with String.match, never call .test() on it (a global
    // regex keeps lastIndex between calls and answers differently).
    DIGIT: /\d/g,
  }),
});
