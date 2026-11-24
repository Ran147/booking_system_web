export const APP_TIME_ZONE = Object.freeze({
  COSTA_RICA: "America/Costa_Rica",
  UTC: "UTC",
} as const);

export type AppTimeZone = (typeof APP_TIME_ZONE)[keyof typeof APP_TIME_ZONE];
