import { HttpsError } from "firebase-functions/v2/https";
import { USER_ROLE } from "./constants/UserRole.constants.js";
import type { NullableUndefined } from "./types/Nullable.js";

interface CallerAuth {
  readonly token?: Record<string, unknown>;
  readonly uid?: string;
}

export const assertSuperAdmin = (auth: NullableUndefined<CallerAuth>): void => {
  if (!auth) {
    throw new HttpsError("unauthenticated", "Unauthenticated request");
  }

  const role = auth.token?.role;
  if (role !== USER_ROLE.SUPER_ADMIN) {
    throw new HttpsError("permission-denied", "Caller is not a super admin");
  }
};
