import { describe, expect, it } from "vitest";
import { createSignUpToken, hashSignUpToken } from "../signUpToken.js";

describe("signUpToken", () => {
  it("KAN-24: creates a different token each time and stores only its hash", () => {
    const firstTokenPair = createSignUpToken();
    const secondTokenPair = createSignUpToken();

    expect(firstTokenPair.signUpToken).not.toBe(secondTokenPair.signUpToken);
    expect(firstTokenPair.signUpTokenHash).not.toBe(firstTokenPair.signUpToken);
    expect(firstTokenPair.signUpTokenHash).toBe(
      hashSignUpToken(firstTokenPair.signUpToken),
    );
  });

  it("KAN-24: makes a URL-safe token", () => {
    expect(createSignUpToken().signUpToken).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
