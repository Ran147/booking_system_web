import { FirebaseError } from "firebase/app";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { mapEmailVerificationError } from "../api/mapEmailVerificationError";
import { EMAIL_VERIFICATION_ERROR_KEY } from "../constants/AuthAction.constants";

describe("mapEmailVerificationError", () => {
  it.each([
    [
      FIREBASE_ERROR_CODE.EXPIRED_ACTION_CODE,
      EMAIL_VERIFICATION_ERROR_KEY.LINK_INVALID,
    ],
    [
      FIREBASE_ERROR_CODE.INVALID_ACTION_CODE,
      EMAIL_VERIFICATION_ERROR_KEY.LINK_INVALID,
    ],
    [
      FIREBASE_ERROR_CODE.USER_DISABLED,
      EMAIL_VERIFICATION_ERROR_KEY.LINK_INVALID,
    ],
    [
      FIREBASE_ERROR_CODE.USER_NOT_FOUND,
      EMAIL_VERIFICATION_ERROR_KEY.LINK_INVALID,
    ],
    [
      FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
      EMAIL_VERIFICATION_ERROR_KEY.NETWORK,
    ],
    ["auth/internal-error", EMAIL_VERIFICATION_ERROR_KEY.UNKNOWN],
  ])("maps %s to %s", (errorCode, expectedMessageKey) => {
    expect(
      mapEmailVerificationError(new FirebaseError(errorCode, errorCode)),
    ).toEqual({ code: errorCode, messageKey: expectedMessageKey });
  });

  it("maps a non-Firebase error to unknown", () => {
    expect(mapEmailVerificationError(new Error("boom"))).toEqual({
      code: FIREBASE_ERROR_CODE.UNKNOWN,
      messageKey: EMAIL_VERIFICATION_ERROR_KEY.UNKNOWN,
    });
  });
});
