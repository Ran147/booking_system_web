export const TONE = {
  DANGER: "danger",
  NEUTRAL: "neutral",
  SUCCESS: "success",
  WARNING: "warning",
} as const;

export type Tone = (typeof TONE)[keyof typeof TONE];

export const TONE_CLASS_NAME = {
  [TONE.DANGER]: "bg-destructive text-destructive-foreground",
  [TONE.NEUTRAL]: "bg-muted text-muted-foreground",
  [TONE.SUCCESS]: "bg-success text-success-foreground",
  [TONE.WARNING]: "bg-warning text-warning-foreground",
} as const satisfies Record<Tone, string>;
