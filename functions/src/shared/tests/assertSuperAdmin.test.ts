import { describe, expect, it } from "vitest";
import { assertSuperAdmin } from "../assertSuperAdmin.js";
import { USER_ROLE } from "../constants/UserRole.constants.js";

describe("assertSuperAdmin", () => {
  it("throws unauthenticated error when auth is null or undefined", () => {
    expect(() => assertSuperAdmin(null)).toThrowError(
      /Unauthenticated request/,
    );
    expect(() => assertSuperAdmin(undefined)).toThrowError(
      /Unauthenticated request/,
    );
  });

  it("throws permission-denied error when role is not super_admin", () => {
    expect(() =>
      assertSuperAdmin({
        token: { role: USER_ROLE.SUBSCRIBER },
        uid: "subscriber-1",
      }),
    ).toThrowError(/Caller is not a super admin/);

    expect(() =>
      assertSuperAdmin({
        token: { role: USER_ROLE.CUSTOMER },
        uid: "customer-1",
      }),
    ).toThrowError(/Caller is not a super admin/);
  });

  it("succeeds when role is super_admin", () => {
    expect(() =>
      assertSuperAdmin({
        token: { role: USER_ROLE.SUPER_ADMIN },
        uid: "admin-sa-1",
      }),
    ).not.toThrow();
  });
});
