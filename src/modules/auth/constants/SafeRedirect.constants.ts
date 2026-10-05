// redirectTo only accepts paths of this site (no open redirects, US-33 D-3).
export const SAFE_REDIRECT = Object.freeze({
  BACKSLASH: "\\",
  INTERNAL_PATH_PREFIX: "/",
  PROTOCOL_RELATIVE_PREFIX: "//",
} as const);
