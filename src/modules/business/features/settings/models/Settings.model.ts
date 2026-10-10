import type { SelectFieldOption } from "@/components";
import type { Language } from "@/constants";
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

/** State and actions exposed to the KAN-51 settings page. */
export interface SettingsPageViewModel {
  /** Language currently used by i18next. */
  currentLanguage: Language;
  /** Changes the interface immediately and synchronizes the user profile. */
  handleLanguageChange: (language: Language) => void;
  /** Whether the profile update is currently running. */
  isSaving: boolean;
  /** Translated options rendered by the language selector. */
  languageOptions: readonly SelectFieldOption[];
  /** Whether the latest profile synchronization failed. */
  showSaveError: boolean;
}
