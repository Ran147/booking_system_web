// create-sign-up-link.ts (KAN-25 spec §6): until KAN-24 sends the email, the
// sign-up link of a real paid checkout is made by hand with this script.
export const CREATE_SIGN_UP_LINK = Object.freeze({
  DEFAULT_SITE_URL: "https://booking-system-web-omega.vercel.app",
  SERVICE_ACCOUNT_FILE_EXTENSION: ".json",
  SERVICE_ACCOUNT_FILE_MARKER: "firebase-adminsdk",
  SIGN_UP_PATH: "/sign-up?token=",
} as const);
