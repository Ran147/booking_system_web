import { LANGUAGE, STORAGE_KEY, type Language } from "@/constants";
import type { Nullable } from "@/types";
import type { PendingLanguageSync } from "../models";

const isLanguage = (value: unknown): value is Language =>
  Object.values(LANGUAGE).some((language) => language === value);

export const readPendingLanguageSync = (): Nullable<PendingLanguageSync> => {
  const storedValue = localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC);
  if (!storedValue) return null;

  try {
    const parsedValue = JSON.parse(storedValue) as Record<string, unknown>;
    return typeof parsedValue.userId === "string" &&
      isLanguage(parsedValue.language)
      ? { language: parsedValue.language, userId: parsedValue.userId }
      : null;
  } catch {
    return null;
  }
};

export const savePendingLanguageSync = (
  pendingLanguageSync: PendingLanguageSync,
): void => {
  localStorage.setItem(
    STORAGE_KEY.LANGUAGE_PENDING_SYNC,
    JSON.stringify(pendingLanguageSync),
  );
};

export const clearPendingLanguageSync = (): void => {
  localStorage.removeItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC);
};
