import { ENV_FLAG, FIREBASE_EMULATOR } from "@/shared/constants";
import { readFirebaseEnvironment } from "../readFirebaseEnvironment";

const EMPTY_ENVIRONMENT: ImportMetaEnv = {
  BASE_URL: "/",
  DEV: true,
  MODE: "test",
  PROD: false,
  SSR: false,
  VITE_FIREBASE_API_KEY: "",
  VITE_FIREBASE_APP_ID: "",
  VITE_FIREBASE_AUTH_DOMAIN: "",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "",
  VITE_FIREBASE_PROJECT_ID: "",
  VITE_FIREBASE_STORAGE_BUCKET: "",
  VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: "",
  VITE_USE_EMULATORS: "",
};

describe("readFirebaseEnvironment", () => {
  it("uses the demo project when the emulators are on and values are empty", () => {
    const firebaseEnvironment = readFirebaseEnvironment({
      ...EMPTY_ENVIRONMENT,
      VITE_USE_EMULATORS: ENV_FLAG.ENABLED,
    });

    expect(firebaseEnvironment.shouldUseEmulators).toBe(true);
    expect(firebaseEnvironment.firebaseOptions.projectId).toBe(
      FIREBASE_EMULATOR.DEMO_PROJECT_ID,
    );
  });

  it("keeps the configured project and site key without emulators", () => {
    const firebaseEnvironment = readFirebaseEnvironment({
      ...EMPTY_ENVIRONMENT,
      VITE_FIREBASE_PROJECT_ID: "booking-dev",
      VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: "site-key",
    });

    expect(firebaseEnvironment.shouldUseEmulators).toBe(false);
    expect(firebaseEnvironment.firebaseOptions.projectId).toBe("booking-dev");
    expect(firebaseEnvironment.recaptchaEnterpriseSiteKey).toBe("site-key");
  });


});
