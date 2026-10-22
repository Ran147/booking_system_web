// Full name rule shared by every form that asks for a person's full name:
// customer sign-up (KAN-123, AS-3) and profile (KAN-170), collaborators
// (KAN-78) and business customers (KAN-88). Leading and trailing spaces are
// trimmed before the length is checked.
export const FULL_NAME_RULE = Object.freeze({
  MAX_LENGTH: 80,
  MIN_LENGTH: 2,
});
