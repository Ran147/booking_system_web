import { STORAGE_KEY, THEME_MODE, type ThemeMode } from "@/constants";
import type { Nullable } from "@/types";
import type { SaveUserThemeInput } from "../models";

const isThemeMode = (value: unknown): value is ThemeMode =>
  Object.values(THEME_MODE).some((themeMode) => themeMode === value);

export const readPendingThemeSync = (): Nullable<SaveUserThemeInput> => {
  const storedValue = localStorage.getItem(STORAGE_KEY.THEME_PENDING_SYNC);
  if (!storedValue) return null;

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (
      typeof parsedValue === "object" &&
      parsedValue !== null &&
      "theme" in parsedValue &&
      "userId" in parsedValue &&
      isThemeMode(parsedValue.theme) &&
      typeof parsedValue.userId === "string"
    ) {
      return { theme: parsedValue.theme, userId: parsedValue.userId };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY.THEME_PENDING_SYNC);
  }

  return null;
};

export const savePendingThemeSync = (input: SaveUserThemeInput): void => {
  localStorage.setItem(STORAGE_KEY.THEME_PENDING_SYNC, JSON.stringify(input));
};

export const clearPendingThemeSync = (): void => {
  localStorage.removeItem(STORAGE_KEY.THEME_PENDING_SYNC);
};
