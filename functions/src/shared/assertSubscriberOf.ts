import { HttpsError } from "firebase-functions/v2/https";
import { USER_ROLE } from "./constants/UserRole.constants.js";
import type { NullableUndefined } from "./types/Nullable.js";

interface CallerAuth {
  readonly token?: Record<string, unknown>;
  readonly uid?: string;
}

export const assertSubscriberOf = (
  auth: NullableUndefined<CallerAuth>,
  businessId: string,
): void => {
  if (!auth) {
    throw new HttpsError("unauthenticated", "Unauthenticated request");
  }

  const role = auth.token?.role;
  const callerBusinessId = auth.token?.businessId;
  const isBusinessOwner =
    role === USER_ROLE.BUSINESS_OWNER || role === USER_ROLE.SUBSCRIBER;

  if (!isBusinessOwner || callerBusinessId !== businessId) {
    throw new HttpsError(
      "permission-denied",
      "Caller is not the subscriber of this business",
    );
  }
};
