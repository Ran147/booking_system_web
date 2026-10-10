import { ROUTE_PATH } from "@/constants";
import { resolveSafeRedirectPath } from "../utils/resolveSafeRedirectPath";

describe("resolveSafeRedirectPath", () => {
  it.each([
    ["/business", "/business"],
    ["/business/subscription", "/business/subscription"],
    [
      "/barberia-centro?service=corte#top",
      "/barberia-centro?service=corte#top",
    ],
  ])("AC-KAN-33-03: keeps the internal path %s", (redirectPath, expected) => {
    expect(resolveSafeRedirectPath(redirectPath)).toBe(expected);
  });

  it.each([
    null,
    "",
    "business",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example/business",
    "javascript:alert(1)",
    ROUTE_PATH.AUTH.SIGN_IN,
  ])("AC-KAN-33-03: rejects %s", (redirectPath) => {
    expect(resolveSafeRedirectPath(redirectPath)).toBeNull();
  });
});
