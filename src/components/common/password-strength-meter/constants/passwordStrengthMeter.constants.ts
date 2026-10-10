import {
  PASSWORD_STRENGTH_LEVEL,
  type PasswordStrengthLevel,
} from "@/shared/domain";

// Segments of the bar filled for each level; the bar is decorative, the level
// is also written as text so it never depends on colour alone.
export const PASSWORD_STRENGTH_FILLED_SEGMENTS = {
  [PASSWORD_STRENGTH_LEVEL.MEDIUM]: 2,
  [PASSWORD_STRENGTH_LEVEL.STRONG]: 3,
  [PASSWORD_STRENGTH_LEVEL.WEAK]: 1,
} as const satisfies Record<PasswordStrengthLevel, number>;

export const PASSWORD_STRENGTH_SEGMENT_CLASS_NAME = {
  [PASSWORD_STRENGTH_LEVEL.MEDIUM]: "bg-warning",
  [PASSWORD_STRENGTH_LEVEL.STRONG]: "bg-success",
  [PASSWORD_STRENGTH_LEVEL.WEAK]: "bg-destructive",
} as const satisfies Record<PasswordStrengthLevel, string>;

export const PASSWORD_STRENGTH_SEGMENTS = [1, 2, 3] as const;
