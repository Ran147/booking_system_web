// Paid checkouts with known sign-up links (KAN-25), for the local Firebase
// Emulator Suite only. The tokens are EMULATOR-ONLY test values: a real link
// token is random (plan-checkout SPEC "Sign-up link").

export const SEED_SIGN_UP_CHECKOUT = {
  EXPIRED: {
    EMAIL: "link-vencido@demo.test",
    ID: "seed-plan-checkout-expired-link",
    SIGN_UP_TOKEN: "seed-expired-sign-up-token",
  },
  VALID: {
    EMAIL: "nuevo-suscriptor@demo.test",
    ID: "seed-plan-checkout-valid-link",
    SIGN_UP_TOKEN: "seed-valid-sign-up-token",
  },
} as const;

// Mirror of SIGN_UP_LINK in
// functions/src/billing/constants/SubscriberSignUp.constants.ts — keep in sync.
export const SEED_SIGN_UP_LINK = {
  HASH_ALGORITHM: "sha256",
  HASH_ENCODING: "hex",
  VALID_DAYS: 7,
} as const;

// The expired link was paid this many days ago, so it expired a day ago.
export const SEED_EXPIRED_LINK_PAID_DAYS_AGO = 8;

// Vite's default dev server, where the printed links open.
export const SEED_SIGN_UP_URL_BASE = "http://localhost:5173/sign-up?token=";
