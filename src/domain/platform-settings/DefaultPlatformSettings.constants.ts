// Used when platformSettings/current cannot be read (AC-KAN-38-04). The admin
// edits the real value in KAN-182.
export const DEFAULT_PLATFORM_SETTINGS = Object.freeze({
  IDLE_TIMEOUT_MINUTES: 15,
} as const);
