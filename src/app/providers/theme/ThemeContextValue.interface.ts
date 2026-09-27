import type { ThemeMode } from "@/shared/constants";

export interface ThemeContextValue {
  isDarkApplied: boolean;
  setThemeMode: (nextThemeMode: ThemeMode) => void;
  themeMode: ThemeMode;
}
