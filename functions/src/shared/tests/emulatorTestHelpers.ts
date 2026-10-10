import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import firebaseFunctionsTest from "firebase-functions-test";
import type { NullableUndefined } from "../types/Nullable.js";

// Helpers for function tests that run against the Auth and Firestore
// emulators (`npm run test:functions`, unit-testing-standards §5).

const DEFAULT_TEST_PROJECT_ID = "demo-booking-system";

// The project the emulators run (`firebase emulators:exec` sets it). Passed to
// firebase-functions-test, which otherwise switches GCLOUD_PROJECT to
// "not-a-project" and the tests would clear a different project.
const testProjectId = process.env.GCLOUD_PROJECT ?? DEFAULT_TEST_PROJECT_ID;

export const functionsTestEnvironment = firebaseFunctionsTest({
  projectId: testProjectId,
});

// Refuses to run outside the Emulator Suite, so a test can never touch a real
// Firebase project.
export const assertEmulatorsRunning = (): void => {
  if (
    !process.env.FIRESTORE_EMULATOR_HOST ||
    !process.env.FIREBASE_AUTH_EMULATOR_HOST
  ) {
    throw new Error(
      "Function tests need the emulators: run `npm run test:functions` from the repository root.",
    );
  }
};

// Empties the Firestore and Auth emulators so each test starts clean.
export const clearEmulators = async (): Promise<void> => {
  await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${testProjectId}/databases/(default)/documents`,
    { method: "DELETE" },
  );
  await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${testProjectId}/accounts`,
    { method: "DELETE" },
  );
};

// Firebase names the payload field of a CallableRequest "data", a name the
// project's code style does not allow for its own identifiers.
const CALLABLE_REQUEST_PAYLOAD_FIELD = "data";

// A callable request from a visitor (no auth), as the client SDK sends it.
export const buildCallableRequest = <Payload>(
  payload: Payload,
): CallableRequest<Payload> =>
  ({
    acceptsStreaming: false,
    [CALLABLE_REQUEST_PAYLOAD_FIELD]: payload,
    rawRequest: {},
  }) as unknown as CallableRequest<Payload>;

// Awaits a call that must fail and returns its HttpsError.
export const captureHttpsError = async (
  pendingCall: Promise<unknown>,
): Promise<HttpsError> => {
  try {
    await pendingCall;
  } catch (error) {
    if (error instanceof HttpsError) return error;
    throw error;
  }
  throw new Error("Expected the call to fail with an HttpsError");
};

export const readErrorReason = (httpsError: HttpsError): unknown =>
  (httpsError.details as NullableUndefined<{ reason?: unknown }>)?.reason;
