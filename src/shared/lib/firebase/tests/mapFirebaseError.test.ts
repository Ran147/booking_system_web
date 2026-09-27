import { FirebaseError } from "firebase/app";
import { ERROR_MESSAGE_KEY, FIREBASE_ERROR_CODE } from "@/shared/constants";
import { mapFirebaseError } from "../mapFirebaseError";

describe("mapFirebaseError", () => {
  it("maps a known Firebase code to its message key", () => {
    const mutationError = mapFirebaseError(
      new FirebaseError(FIREBASE_ERROR_CODE.PERMISSION_DENIED, "denied"),
    );

    expect(mutationError.messageKey).toBe(ERROR_MESSAGE_KEY.PERMISSION_DENIED);
  });

  it("falls back to the unknown message for anything else", () => {
    expect(mapFirebaseError(new Error("boom"))).toEqual({
      code: FIREBASE_ERROR_CODE.UNKNOWN,
      messageKey: ERROR_MESSAGE_KEY.UNKNOWN,
    });
  });
});
