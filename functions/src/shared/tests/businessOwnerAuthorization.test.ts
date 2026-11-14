import { describe, expect, it } from "vitest";
import { assertCanManageServices } from "../assertCanManageServices.js";
import { assertSubscriberOf } from "../assertSubscriberOf.js";
import { USER_ROLE } from "../constants/UserRole.constants.js";

const BUSINESS_ID = "business-a";
const OTHER_BUSINESS_ID = "business-b";
const BUSINESS_OWNER_AUTH = {
  token: {
    businessId: BUSINESS_ID,
    role: USER_ROLE.BUSINESS_OWNER,
  },
  uid: "business-owner-a",
};

describe("business owner authorization", () => {
  it("KAN-199: accepts a business owner for their exact business", () => {
    expect(() =>
      assertSubscriberOf(BUSINESS_OWNER_AUTH, BUSINESS_ID),
    ).not.toThrow();
  });

  it("KAN-199: rejects a business owner for another business", () => {
    expect(() =>
      assertSubscriberOf(BUSINESS_OWNER_AUTH, OTHER_BUSINESS_ID),
    ).toThrowError(expect.objectContaining({ code: "permission-denied" }));
  });

  it("KAN-199: accepts the Sprint_1 business_id claim alias", () => {
    expect(() =>
      assertSubscriberOf(
        {
          token: {
            business_id: BUSINESS_ID,
            role: USER_ROLE.BUSINESS_OWNER,
          },
          uid: "business-owner-a",
        },
        BUSINESS_ID,
      ),
    ).not.toThrow();
  });

  it("KAN-199: accepts a business owner managing services in their exact business", async () => {
    await expect(
      assertCanManageServices(BUSINESS_OWNER_AUTH, BUSINESS_ID),
    ).resolves.toBeUndefined();
  });

  it("KAN-199: rejects a business owner managing services in another business", async () => {
    await expect(
      assertCanManageServices(BUSINESS_OWNER_AUTH, OTHER_BUSINESS_ID),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
});
