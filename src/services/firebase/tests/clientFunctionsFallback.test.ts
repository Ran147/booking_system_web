import { FUNCTION_NAME } from "@/constants";
import { executeClientFunctionsFallback } from "../clientFunctionsFallback";

describe("clientFunctionsFallback", () => {
  it("KAN-199: rejects subscriber sign-up instead of creating resources from the client", async () => {
    await expect(
      executeClientFunctionsFallback(
        FUNCTION_NAME.COMPLETE_SUBSCRIBER_SIGN_UP,
        {
          businessSlug: "secure-business",
          email: "owner@example.com",
          password: "Password123!",
        },
      ),
    ).rejects.toThrow(
      `Cloud function "${FUNCTION_NAME.COMPLETE_SUBSCRIBER_SIGN_UP}" is not available.`,
    );
  });
});
