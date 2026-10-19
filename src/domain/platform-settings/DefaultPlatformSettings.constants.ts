// Used when platformSettings/current cannot be read (AC-KAN-38-04, AC-KAN-41-08).
// The admin edits the real value in KAN-182.
export const DEFAULT_PLATFORM_SETTINGS = Object.freeze({
  GRACE_PERIOD_DAYS: 7,
  IDLE_TIMEOUT_MINUTES: 15,
} as const);
