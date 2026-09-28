import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// Firestore rules tests need the emulator. `npm run test:rules` starts it
// through `firebase emulators:exec`, which sets FIRESTORE_EMULATOR_HOST, so
// `npm run test:run` never picks them up.
const isFirestoreEmulatorRunning = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        include: ["src/portals/**", "src/features/**", "src/shared/domain/**"],
        provider: "v8",
        thresholds: { lines: 70 },
      },
      environment: "jsdom",
      // Rules test files share one emulator database and each clears it in
      // beforeEach, so they must not run in parallel.
      fileParallelism: !isFirestoreEmulatorRunning,
      globals: true,
      include: isFirestoreEmulatorRunning
        ? ["tests/rules/**/*.test.ts"]
        : ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["./src/shared/test-utils/setupTests.ts"],
    },
  }),
);
