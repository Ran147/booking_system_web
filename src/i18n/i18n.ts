import { createInstance } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import {
  DEFAULT_LANGUAGE,
  I18N_NAMESPACE,
  LANGUAGE,
  STORAGE_KEY,
} from "@/shared/constants";
import { resources } from "./resources";

export const i18n = createInstance();

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    defaultNS: I18N_NAMESPACE.COMMON,
    detection: {
      caches: ["localStorage"],
      lookupLocalStorage: STORAGE_KEY.LANGUAGE,
      order: ["localStorage", "navigator"],
    },
    fallbackLng: DEFAULT_LANGUAGE,
    initAsync: false,
    interpolation: { escapeValue: false },
    load: "languageOnly",
    ns: Object.values(I18N_NAMESPACE),
    resources,
    supportedLngs: Object.values(LANGUAGE),
  });

i18n.on("languageChanged", (language: string) => {
  document.documentElement.lang = language;
});
