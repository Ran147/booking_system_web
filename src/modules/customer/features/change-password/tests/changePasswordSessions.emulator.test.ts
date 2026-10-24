import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  getIdToken,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NullableRef } from "@/types";

const TEST_PROJECT_ID = "demo-booking-system";
const AUTH_EMULATOR_URL = "http://127.0.0.1:9099";
const AUTH_EMULATOR_TEST_MODE = "emulator";
const CURRENT_PASSWORD = "Current1!";
const CUSTOMER_EMAIL = "kan-171-sessions@example.com";
const NEW_PASSWORD = "NewSecure2@";
const FIREBASE_OPTIONS = {
  apiKey: "demo-api-key",
  projectId: TEST_PROJECT_ID,
};

const isAuthEmulatorRunning = import.meta.env.MODE === AUTH_EMULATOR_TEST_MODE;

describe.runIf(isAuthEmulatorRunning)(
  "change-password session invalidation (KAN-171 Auth Emulator)",
  () => {
    let deleteTestApps: NullableRef<() => Promise<void>> = null;

    beforeEach(async () => {
      await fetch(
        `${AUTH_EMULATOR_URL}/emulator/v1/projects/${TEST_PROJECT_ID}/accounts`,
        { method: "DELETE" },
      );
    });

    afterEach(async () => {
      await deleteTestApps?.();
      deleteTestApps = null;
      vi.doUnmock("@/services");
    });

    it("KAN-171 characterization: documents the Auth Emulator session behavior after a password change", async () => {
      const primaryApp = initializeApp(
        FIREBASE_OPTIONS,
        `kan-171-session-a-${crypto.randomUUID()}`,
      );
      const auth = getAuth(primaryApp);
      connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
      const sessionACredential = await createUserWithEmailAndPassword(
        auth,
        CUSTOMER_EMAIL,
        CURRENT_PASSWORD,
      );

      const secondaryApp = initializeApp(
        FIREBASE_OPTIONS,
        `kan-171-session-b-${crypto.randomUUID()}`,
      );
      deleteTestApps = async (): Promise<void> => {
        await Promise.all([deleteApp(primaryApp), deleteApp(secondaryApp)]);
      };
      const secondaryAuth = getAuth(secondaryApp);
      connectAuthEmulator(secondaryAuth, AUTH_EMULATOR_URL, {
        disableWarnings: true,
      });
      const sessionBCredential = await signInWithEmailAndPassword(
        secondaryAuth,
        CUSTOMER_EMAIL,
        CURRENT_PASSWORD,
      );
      const sessionBIdTokenBeforeChange = await getIdToken(
        sessionBCredential.user,
      );
      const sessionBRefreshTokenBeforeChange =
        sessionBCredential.user.refreshToken;

      vi.doMock("@/services", (): { auth: typeof auth } => ({ auth }));
      const { changeCurrentUserPassword } = await import("@/modules/auth");
      await changeCurrentUserPassword({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
      });

      await expect(getIdToken(sessionACredential.user, true)).resolves.toEqual(
        expect.any(String),
      );
      await expect(getIdToken(sessionBCredential.user)).resolves.toBe(
        sessionBIdTokenBeforeChange,
      );
      expect(sessionBCredential.user.refreshToken).toBe(
        sessionBRefreshTokenBeforeChange,
      );
      await expect(getIdToken(sessionBCredential.user, true)).resolves.toEqual(
        expect.any(String),
      );
      expect(sessionBCredential.user.refreshToken).toBe(
        sessionBRefreshTokenBeforeChange,
      );
    });
  },
);
