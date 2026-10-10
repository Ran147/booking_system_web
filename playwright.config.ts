import { defineConfig, devices } from "@playwright/test";
import { FIREBASE_EMULATOR } from "./src/constants/firebase/FirebaseEmulator.constants";
import { RECAPTCHA } from "./src/constants/recaptcha/Recaptcha.constants";

// End-to-end tests for critical flows only (unit-testing-standards).
// The app runs against the Firebase emulators, so no real project is needed.
// Starting them needs Java 21 or newer (README).
const PREVIEW_PORT = 4173;
const BASE_URL = `http://localhost:${PREVIEW_PORT}`;
const EMULATOR_START_TIMEOUT_MS = 180_000;

// A callable answers GET with 400 once loaded and 404 before, so this URL is
// ready only when verifyRecaptcha can be called.
const FUNCTIONS_READY_URL = `http://${FIREBASE_EMULATOR.HOST}:${FIREBASE_EMULATOR.PORT.FUNCTIONS}/${FIREBASE_EMULATOR.DEMO_PROJECT_ID}/us-central1/verifyRecaptcha`;

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: "list",
  retries: 0,
  testDir: "./e2e",
  use: {
    baseURL: BASE_URL,
    locale: "es-ES",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: `npm --prefix functions run build && npx firebase emulators:start --only auth,firestore,functions --project ${FIREBASE_EMULATOR.DEMO_PROJECT_ID}`,
      reuseExistingServer: !process.env.CI,
      timeout: EMULATOR_START_TIMEOUT_MS,
      url: FUNCTIONS_READY_URL,
    },
    {
      command: `npm run build && npx vite preview --port ${PREVIEW_PORT} --strictPort`,
      // Process env wins over .env.local, so a developer's real project or
      // site key never leaks into the e2e build.
      env: {
        VITE_FIREBASE_PROJECT_ID: FIREBASE_EMULATOR.DEMO_PROJECT_ID,
        VITE_RECAPTCHA_SITE_KEY: RECAPTCHA.TEST_SITE_KEY,
        VITE_USE_EMULATORS: "true",
      },
      reuseExistingServer: !process.env.CI,
      url: BASE_URL,
    },
  ],
});
