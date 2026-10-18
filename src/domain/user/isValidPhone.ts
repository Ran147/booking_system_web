import { PHONE_RULE } from "./PhoneRule.constants";

// Counts digits, not characters, so "-------" or "(((((((" is never a phone.
export const isValidPhone = (phone: string): boolean => {
  const digitCount = phone.match(PHONE_RULE.PATTERN.DIGIT)?.length ?? 0;
  return (
    phone.length <= PHONE_RULE.MAX_LENGTH &&
    PHONE_RULE.PATTERN.ALLOWED_CHARACTERS.test(phone) &&
    digitCount >= PHONE_RULE.MIN_DIGITS &&
    digitCount <= PHONE_RULE.MAX_DIGITS
  );
};
