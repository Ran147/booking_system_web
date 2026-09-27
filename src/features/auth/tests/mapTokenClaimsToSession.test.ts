import { USER_ROLE } from "@/shared/domain";
import { mapTokenClaimsToSession } from "../api/mapTokenClaimsToSession";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";

describe("mapTokenClaimsToSession", () => {
  it("KAN-28: reads the subscriber role and businessId claims", () => {
    expect(
      mapTokenClaimsToSession("user-1", {
        businessId: "business-1",
        role: USER_ROLE.SUBSCRIBER,
      }),
    ).toEqual({
      businessId: "business-1",
      role: USER_ROLE.SUBSCRIBER,
      status: SESSION_STATUS.SIGNED_IN,
      userId: "user-1",
    });
  });

  it("KAN-128: signs in a customer without a businessId", () => {
    expect(
      mapTokenClaimsToSession("user-2", { role: USER_ROLE.CUSTOMER }),
    ).toEqual({
      businessId: null,
      role: USER_ROLE.CUSTOMER,
      status: SESSION_STATUS.SIGNED_IN,
      userId: "user-2",
    });
  });

  it("KAN-28: gives no portal access when the role claim is unknown", () => {
    expect(mapTokenClaimsToSession("user-3", { role: "collaborator" })).toEqual(
      { status: SESSION_STATUS.SIGNED_OUT },
    );
  });
});
