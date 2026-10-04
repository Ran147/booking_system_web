export const I18N_NAMESPACE = {
  ADMIN: "admin",
  BUSINESS: "business",
  COMMON: "common",
  CUSTOMER: "customer",
  LANDING: "landing",
  VALIDATION: "validation",
} as const;

export type I18nNamespace =
  (typeof I18N_NAMESPACE)[keyof typeof I18N_NAMESPACE];
