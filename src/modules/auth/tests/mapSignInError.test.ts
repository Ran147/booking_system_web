import { FirebaseError } from "firebase/app";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { mapSignInError } from "../api/mapSignInError";
import { SIGN_IN_ERROR_KEY } from "../constants/SignInErrorKey.constants";

describe("mapSignInError", () => {
  it.each([
    [
      FIREBASE_ERROR_CODE.INVALID_CREDENTIAL,
      SIGN_IN_ERROR_KEY.INVALID_CREDENTIALS,
    ],
    [FIREBASE_ERROR_CODE.INVALID_EMAIL, SIGN_IN_ERROR_KEY.INVALID_CREDENTIALS],
    [FIREBASE_ERROR_CODE.USER_NOT_FOUND, SIGN_IN_ERROR_KEY.INVALID_CREDENTIALS],
    [FIREBASE_ERROR_CODE.WRONG_PASSWORD, SIGN_IN_ERROR_KEY.INVALID_CREDENTIALS],
    [
      FIREBASE_ERROR_CODE.TOO_MANY_REQUESTS,
      SIGN_IN_ERROR_KEY.TOO_MANY_ATTEMPTS,
    ],
    [FIREBASE_ERROR_CODE.USER_DISABLED, SIGN_IN_ERROR_KEY.ACCOUNT_DISABLED],
    [FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED, SIGN_IN_ERROR_KEY.NETWORK],
    [FIREBASE_ERROR_CODE.FUNCTIONS_INTERNAL, SIGN_IN_ERROR_KEY.NETWORK],
    [FIREBASE_ERROR_CODE.FUNCTIONS_UNAVAILABLE, SIGN_IN_ERROR_KEY.NETWORK],
    [
      FIREBASE_ERROR_CODE.FUNCTIONS_INVALID_ARGUMENT,
      SIGN_IN_ERROR_KEY.RECAPTCHA_REJECTED,
    ],
    [
      FIREBASE_ERROR_CODE.FUNCTIONS_PERMISSION_DENIED,
      SIGN_IN_ERROR_KEY.RECAPTCHA_REJECTED,
    ],
    ["auth/operation-not-allowed", SIGN_IN_ERROR_KEY.UNKNOWN],
  ])("maps %s to %s", (errorCode, expectedMessageKey) => {
    expect(mapSignInError(new FirebaseError(errorCode, errorCode))).toEqual({
      code: errorCode,
      messageKey: expectedMessageKey,
    });
  });

  it("AC-KAN-34-06: maps an error that is not from Firebase to unknown", () => {
    expect(mapSignInError(new Error("boom"))).toEqual({
      code: FIREBASE_ERROR_CODE.UNKNOWN,
      messageKey: SIGN_IN_ERROR_KEY.UNKNOWN,
    });
  });
});
