import { PASSWORD_STRENGTH_LEVEL, type PasswordStrengthLevel } from "@/domain";

// Segments of the bar filled for each level. The bar is decorative: the level
// is also written as text, so it never depends on colour alone.
export const PASSWORD_STRENGTH_FILLED_SEGMENTS = Object.freeze({
  [PASSWORD_STRENGTH_LEVEL.MEDIUM]: 2,
  [PASSWORD_STRENGTH_LEVEL.STRONG]: 3,
  [PASSWORD_STRENGTH_LEVEL.WEAK]: 1,
} satisfies Record<PasswordStrengthLevel, number>);

export const PASSWORD_STRENGTH_SEGMENT_CLASS_NAME = Object.freeze({
  [PASSWORD_STRENGTH_LEVEL.MEDIUM]: "bg-warning",
  [PASSWORD_STRENGTH_LEVEL.STRONG]: "bg-success",
  [PASSWORD_STRENGTH_LEVEL.WEAK]: "bg-destructive",
} satisfies Record<PasswordStrengthLevel, string>);

export const PASSWORD_STRENGTH_SEGMENTS = Object.freeze([1, 2, 3] as const);
