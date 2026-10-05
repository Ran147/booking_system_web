import {
  ENV_FLAG,
  FIREBASE_EMULATOR,
  RECAPTCHA,
  STRING,
} from "@/shared/constants";
import type { FirebaseEnvironment } from "./FirebaseEnvironment.interface";

export const readFirebaseEnvironment = (
  environment: ImportMetaEnv,
): FirebaseEnvironment => {
  const shouldUseEmulators =
    environment.VITE_USE_EMULATORS === ENV_FLAG.ENABLED;

  // The emulators accept any project; the demo- id keeps them offline.
  const emulatorFallback = (
    configuredValue: string,
    demoValue: string,
  ): string =>
    configuredValue || (shouldUseEmulators ? demoValue : configuredValue);

  return {
    firebaseOptions: {
      apiKey: emulatorFallback(
        environment.VITE_FIREBASE_API_KEY,
        FIREBASE_EMULATOR.DEMO_API_KEY,
      ),
      appId: environment.VITE_FIREBASE_APP_ID,
      authDomain: environment.VITE_FIREBASE_AUTH_DOMAIN,
      ...(environment.VITE_FIREBASE_MEASUREMENT_ID
        ? { measurementId: environment.VITE_FIREBASE_MEASUREMENT_ID }
        : {}),
      messagingSenderId: environment.VITE_FIREBASE_MESSAGING_SENDER_ID,
      projectId: emulatorFallback(
        environment.VITE_FIREBASE_PROJECT_ID,
        FIREBASE_EMULATOR.DEMO_PROJECT_ID,
      ),
      storageBucket: environment.VITE_FIREBASE_STORAGE_BUCKET,
    },
    recaptchaEnterpriseSiteKey:
      environment.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY || null,
    // Google's public test key always passes; only used with the emulators.
    recaptchaSiteKey: emulatorFallback(
      environment.VITE_RECAPTCHA_SITE_KEY || STRING.EMPTY,
      RECAPTCHA.TEST_SITE_KEY,
    ),
    shouldUseEmulators,
  };
};
