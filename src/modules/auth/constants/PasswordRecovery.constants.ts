// AS-2: a new recovery request can be sent after 60 seconds (AC-KAN-36-06).
export const PASSWORD_RECOVERY = Object.freeze({
  COOLDOWN_SECONDS: 60,
  COOLDOWN_TICK_MS: 1_000,
} as const);
