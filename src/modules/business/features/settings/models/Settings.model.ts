import type { RadioGroupOption, SelectFieldOption } from "@/components";
import type { Language, ThemeMode } from "@/constants";
import type { Nullable } from "@/types";

/** Language preference read from the authenticated user's profile. */
export interface UserLanguagePreference {
  /** Saved language, or null when the user has never chosen one. */
  language: Nullable<Language>;
}

/** Input used to save the authenticated user's language. */
export interface SaveUserLanguageInput {
  /** New supported interface language. */
  language: Language;
  /** Authenticated user's Firebase UID. */
  userId: string;
}

/** Locally persisted language change that has not reached Firestore yet. */
export type PendingLanguageSync = SaveUserLanguageInput;

/** Payload used to persist a theme for one authenticated account. */
export interface SaveUserThemeInput {
  readonly theme: ThemeMode;
  readonly userId: string;
}

/** Theme information read from a user profile. */
export interface UserThemePreference {
  readonly theme: Nullable<ThemeMode>;
}

/** State and actions exposed to the KAN-51 settings page. */
export interface SettingsPageViewModel {
  /** Language currently used by i18next. */
  currentLanguage: Language;
  /** Changes the interface immediately and synchronizes the user profile. */
  handleLanguageChange: (language: Language) => void;
  /** Changes the theme immediately and synchronizes the user profile. */
  handleThemeChange: (nextTheme: string) => void;
  /** Whether the language update is currently running. */
  isLanguageSaving: boolean;
  /** Whether the theme update is currently running. */
  isThemeSaving: boolean;
  /** Translated options rendered by the language selector. */
  languageOptions: readonly SelectFieldOption[];
  /** Whether the latest language synchronization failed. */
  showLanguageSaveError: boolean;
  /** Whether the latest theme synchronization failed. */
  showThemeSaveError: boolean;
  /** Theme currently applied by the theme provider. */
  themeMode: ThemeMode;
  /** Translated options rendered by the theme selector. */
  themeOptions: readonly RadioGroupOption[];
}
