import adminEn from "./locales/en/admin.json";
import businessEn from "./locales/en/business.json";
import commonEn from "./locales/en/common.json";
import customerEn from "./locales/en/customer.json";
import landingEn from "./locales/en/landing.json";
import validationEn from "./locales/en/validation.json";
import adminEs from "./locales/es/admin.json";
import businessEs from "./locales/es/business.json";
import commonEs from "./locales/es/common.json";
import customerEs from "./locales/es/customer.json";
import landingEs from "./locales/es/landing.json";
import validationEs from "./locales/es/validation.json";

export const resources = {
  en: {
    admin: adminEn,
    business: businessEn,
    common: commonEn,
    customer: customerEn,
    landing: landingEn,
    validation: validationEn,
  },
  es: {
    admin: adminEs,
    business: businessEs,
    common: commonEs,
    customer: customerEs,
    landing: landingEs,
    validation: validationEs,
  },
} as const;
