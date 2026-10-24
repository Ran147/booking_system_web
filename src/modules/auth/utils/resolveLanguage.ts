import { DEFAULT_LANGUAGE, LANGUAGE, type Language } from "@/constants";

export const resolveLanguage = (language: string): Language =>
  language.startsWith(LANGUAGE.EN) ? LANGUAGE.EN : DEFAULT_LANGUAGE;
