import type { Language } from "@/constants";

export interface UpdateLanguagePreferencePayload {
  language: Language;
  userId: string;
}
