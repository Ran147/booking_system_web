import type { Language } from "@/constants";

export interface LanguagePreferenceViewModel {
  currentLanguage: Language;
  handleLanguageChange: (language: Language) => Promise<void>;
  isLoadingPreference: boolean;
  isSaving: boolean;
}
