import { execSync } from "node:child_process";
import { SEED_ENV_VAR } from "../scripts/constants/SeedEmulator.constants";
import { FIREBASE_EMULATOR } from "../src/constants/firebase/FirebaseEmulator.constants";

// Loads the seed accounts into the running emulators. Idempotent, but not
// safe to run twice at the same time: call it from a serial describe.
export const seedEmulators = (): void => {
  execSync("npm run seed", {
    env: {
      ...process.env,
      [SEED_ENV_VAR.AUTH_EMULATOR_HOST]: new URL(FIREBASE_EMULATOR.AUTH_URL)
        .host,
      [SEED_ENV_VAR.FIRESTORE_EMULATOR_HOST]: `${FIREBASE_EMULATOR.HOST}:${FIREBASE_EMULATOR.PORT.FIRESTORE}`,
      [SEED_ENV_VAR.PROJECT_ID]: FIREBASE_EMULATOR.DEMO_PROJECT_ID,
    },
    stdio: "inherit",
  });
};
