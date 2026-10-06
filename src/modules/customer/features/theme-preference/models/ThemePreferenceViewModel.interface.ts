import type { ThemeMode } from "@/constants";

export interface ThemePreferenceViewModel {
  handleThemeChange: (themeMode: ThemeMode) => void;
  isLoading: boolean;
  isSyncError: boolean;
  isSyncing: boolean;
  themeMode: ThemeMode;
}
