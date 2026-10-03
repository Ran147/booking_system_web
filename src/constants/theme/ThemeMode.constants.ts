export const THEME_MODE = {
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
} as const;

export type ThemeMode = (typeof THEME_MODE)[keyof typeof THEME_MODE];

export const THEME_CLASS = {
  DARK: "dark",
} as const;

export const THEME_MEDIA_QUERY = {
  PREFERS_DARK: "(prefers-color-scheme: dark)",
} as const;
