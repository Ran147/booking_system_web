import { THEME_MODE, type ThemeMode } from "@/constants";

export const isThemeMode = (value: unknown): value is ThemeMode =>
  Object.values(THEME_MODE).some((themeMode) => themeMode === value);
