import { useEffect, useMemo, useState } from "react";
import {
  BROWSER_EVENT,
  STORAGE_KEY,
  THEME_CLASS,
  THEME_MEDIA_QUERY,
  THEME_MODE,
  type ThemeMode,
} from "@/shared/constants";
import type { ThemeContextValue } from "./ThemeContextValue.interface";

const isThemeMode = (storedValue: unknown): storedValue is ThemeMode =>
  Object.values(THEME_MODE).some((themeMode) => themeMode === storedValue);

const readStoredThemeMode = (): ThemeMode => {
  const storedValue = localStorage.getItem(STORAGE_KEY.THEME);
  return isThemeMode(storedValue) ? storedValue : THEME_MODE.SYSTEM;
};

export const useThemeController = (): ThemeContextValue => {
  const [themeMode, setThemeModeState] =
    useState<ThemeMode>(readStoredThemeMode);
  const [prefersDark, setPrefersDark] = useState<boolean>(
    () => window.matchMedia(THEME_MEDIA_QUERY.PREFERS_DARK).matches,
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(THEME_MEDIA_QUERY.PREFERS_DARK);
    const handleSchemeChange = (event: MediaQueryListEvent): void => {
      setPrefersDark(event.matches);
    };
    mediaQueryList.addEventListener(BROWSER_EVENT.CHANGE, handleSchemeChange);
    return (): void => {
      mediaQueryList.removeEventListener(
        BROWSER_EVENT.CHANGE,
        handleSchemeChange,
      );
    };
  }, []);

  const isDarkApplied =
    themeMode === THEME_MODE.DARK ||
    (themeMode === THEME_MODE.SYSTEM && prefersDark);

  useEffect(() => {
    document.documentElement.classList.toggle(THEME_CLASS.DARK, isDarkApplied);
  }, [isDarkApplied]);

  return useMemo(
    () => ({
      isDarkApplied,
      setThemeMode: (nextThemeMode: ThemeMode): void => {
        localStorage.setItem(STORAGE_KEY.THEME, nextThemeMode);
        setThemeModeState(nextThemeMode);
      },
      themeMode,
    }),
    [isDarkApplied, themeMode],
  );
};
