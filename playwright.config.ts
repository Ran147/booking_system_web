import { defineConfig, devices } from "@playwright/test";

// End-to-end tests for critical flows only (unit-testing-standards).
// The app runs against the Firebase emulators, so no real project is needed.
const PREVIEW_PORT = 4173;
const BASE_URL = `http://localhost:${PREVIEW_PORT}`;

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
  webServer: {
    command: `npm run build && npx vite preview --port ${PREVIEW_PORT} --strictPort`,
    env: { VITE_USE_EMULATORS: "true" },
    reuseExistingServer: !process.env.CI,
    url: BASE_URL,
  },
});
