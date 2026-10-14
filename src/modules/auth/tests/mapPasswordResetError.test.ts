import { FirebaseError } from "firebase/app";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { mapPasswordResetError } from "../api/mapPasswordResetError";
import { PASSWORD_RESET_ERROR_KEY } from "../constants/PasswordResetErrorKey.constants";

describe("mapPasswordResetError", () => {
  it.each([
    [
      FIREBASE_ERROR_CODE.EXPIRED_ACTION_CODE,
      PASSWORD_RESET_ERROR_KEY.LINK_INVALID,
    ],
    [
      FIREBASE_ERROR_CODE.INVALID_ACTION_CODE,
      PASSWORD_RESET_ERROR_KEY.LINK_INVALID,
    ],
    [
      FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
      PASSWORD_RESET_ERROR_KEY.NETWORK,
    ],
    [FIREBASE_ERROR_CODE.FUNCTIONS_INTERNAL, PASSWORD_RESET_ERROR_KEY.NETWORK],
    [
      FIREBASE_ERROR_CODE.FUNCTIONS_UNAVAILABLE,
      PASSWORD_RESET_ERROR_KEY.NETWORK,
    ],
    [
      FIREBASE_ERROR_CODE.FUNCTIONS_INVALID_ARGUMENT,
      PASSWORD_RESET_ERROR_KEY.RECAPTCHA_REJECTED,
    ],
    [
      FIREBASE_ERROR_CODE.FUNCTIONS_PERMISSION_DENIED,
      PASSWORD_RESET_ERROR_KEY.RECAPTCHA_REJECTED,
    ],
    ["auth/weak-password", PASSWORD_RESET_ERROR_KEY.UNKNOWN],
  ])("maps %s to %s", (errorCode, expectedMessageKey) => {
    expect(
      mapPasswordResetError(new FirebaseError(errorCode, errorCode)),
    ).toEqual({ code: errorCode, messageKey: expectedMessageKey });
  });

  it("maps an error that is not from Firebase to unknown", () => {
    expect(mapPasswordResetError(new Error("boom"))).toEqual({
      code: FIREBASE_ERROR_CODE.UNKNOWN,
      messageKey: PASSWORD_RESET_ERROR_KEY.UNKNOWN,
    });
  });
});
