export const LANGUAGE = {
  EN: "en",
  ES: "es",
} as const;

export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];

export const DEFAULT_LANGUAGE = LANGUAGE.ES;
