import { STORAGE_KEY } from "@/constants";
import type { Nullable } from "@/types";
import type { SaveUserThemeInput } from "../models";
import { isThemeMode } from "./isThemeMode";

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
    // Invalid local state is discarded below so it cannot block profile sync.
  }

  clearPendingThemeSync();
  return null;
};

export const savePendingThemeSync = (input: SaveUserThemeInput): void => {
  localStorage.setItem(STORAGE_KEY.THEME_PENDING_SYNC, JSON.stringify(input));
};

export const clearPendingThemeSync = (): void => {
  localStorage.removeItem(STORAGE_KEY.THEME_PENDING_SYNC);
};

export const clearPendingThemeSyncIfMatches = (
  expectedPendingThemeSync: SaveUserThemeInput,
): void => {
  const currentPendingThemeSync = readPendingThemeSync();
  if (
    currentPendingThemeSync?.theme === expectedPendingThemeSync.theme &&
    currentPendingThemeSync.userId === expectedPendingThemeSync.userId
  ) {
    clearPendingThemeSync();
  }
};
