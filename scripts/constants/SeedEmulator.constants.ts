// Seed data for the local Firebase Emulator Suite only (npm run seed).
// Nothing here is a real account. The passwords below are EMULATOR-ONLY test
// values: never reuse them in a real Firebase project.

export const SEED_ENV_VAR = {
  AUTH_EMULATOR_HOST: "FIREBASE_AUTH_EMULATOR_HOST",
  FIRESTORE_EMULATOR_HOST: "FIRESTORE_EMULATOR_HOST",
  PROJECT_ID: "GCLOUD_PROJECT",
} as const;

export const SEED_DEFAULT_PROJECT_ID = "demo-booking-system";

export const SEED_AUTH_ERROR_CODE = {
  USER_NOT_FOUND: "auth/user-not-found",
} as const;

export const SEED_DOCUMENT_ID = {
  BUSINESS: "seed-business-barberia-centro",
  PLAN_BASIC: "seed-plan-basic",
  PLAN_PRO: "seed-plan-pro",
  SERVICE_BEARD: "seed-service-beard-trim",
  SERVICE_COLOR: "seed-service-hair-color",
  SERVICE_HAIRCUT: "seed-service-haircut",
  SUBSCRIPTION: "current",
} as const;

// EMULATOR-ONLY credentials, printed by the script so the team can sign in.
export const SEED_USER = {
  CUSTOMER: {
    EMAIL: "cliente@demo.test",
    FULL_NAME: "Carla Cliente",
    PASSWORD: "Emulator-Only-123!",
    PHONE: "+52 55 1000 0003",
    UID: "seed-customer",
  },
  SUBSCRIBER: {
    EMAIL: "suscriptor@demo.test",
    FULL_NAME: "Sergio Suscriptor",
    PASSWORD: "Emulator-Only-123!",
    PHONE: "+52 55 1000 0002",
    UID: "seed-subscriber",
  },
  SUPER_ADMIN: {
    EMAIL: "admin@demo.test",
    FULL_NAME: "Ana Admin",
    PASSWORD: "Emulator-Only-123!",
    PHONE: "+52 55 1000 0001",
    UID: "seed-super-admin",
  },
} as const;

export const SEED_BUSINESS = {
  CURRENCY: "MXN",
  NAME: "Barbería Centro",
  SLUG: "barberia-centro",
  TIME_ZONE: "America/Mexico_City",
} as const;

// Provisional shape: BusinessHours has no fields in domain-glossary yet
// (KAN-64). One opening range per weekday; Sunday is closed.
export const SEED_BUSINESS_HOURS_RANGE = {
  CLOSES_AT: "19:00",
  OPENS_AT: "09:00",
} as const;

export const SEED_WEEKDAY = {
  FRIDAY: "friday",
  MONDAY: "monday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
  THURSDAY: "thursday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
} as const;

export const SEED_BILLING_PERIOD = {
  MONTHLY: "monthly",
} as const;

export const SEED_PLAN = {
  BASIC: {
    MAX_BOOKINGS: 200,
    NAME: "Básico",
    PRICE_IN_CENTS: 29_900,
  },
  PRO: {
    MAX_BOOKINGS: 1_000,
    NAME: "Pro",
    PRICE_IN_CENTS: 59_900,
  },
} as const;

export const SEED_SERVICE = {
  BEARD: {
    DESCRIPTION: "Perfilado y arreglo de barba con toalla caliente.",
    DURATION_MINUTES: 30,
    NAME: "Arreglo de barba",
    PRICE_IN_CENTS: 15_000,
  },
  COLOR: {
    DESCRIPTION: "Tinte completo con lavado y secado.",
    DURATION_MINUTES: 90,
    NAME: "Tinte",
    PRICE_IN_CENTS: 60_000,
  },
  HAIRCUT: {
    DESCRIPTION: "Corte clásico con lavado.",
    DURATION_MINUTES: 45,
    NAME: "Corte de cabello",
    PRICE_IN_CENTS: 25_000,
  },
} as const;

export const SEED_SUBSCRIPTION_PERIOD = {
  DAYS: 30,
  MS_PER_DAY: 86_400_000,
} as const;
