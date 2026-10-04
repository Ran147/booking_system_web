import { createInstance, type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "@/i18n/resources";
import { I18N_NAMESPACE, LANGUAGE } from "@/shared/constants";

export const createTestI18n = (): I18nInstance => {
  const testI18nInstance = createInstance();
  void testI18nInstance.use(initReactI18next).init({
    defaultNS: I18N_NAMESPACE.COMMON,
    initAsync: false,
    lng: LANGUAGE.ES,
    resources,
  });
  return testI18nInstance;
};

export const testI18n = createTestI18n();
