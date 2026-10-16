import { describe, expect, it } from "vitest";
import { isReservedBusinessSlug } from "../isReservedBusinessSlug.js";

describe("isReservedBusinessSlug", () => {
  it("KAN-25: rejects a static route segment as a slug (AC-KAN-25-17)", () => {
    expect(isReservedBusinessSlug("sign-up")).toBe(true);
  });

  it("KAN-25: ignores case and surrounding spaces (AC-KAN-25-17)", () => {
    expect(isReservedBusinessSlug("  ADMIN ")).toBe(true);
  });

  it("KAN-25: accepts a normal business slug (AC-KAN-25-15)", () => {
    expect(isReservedBusinessSlug("peluqueria-dona-ana")).toBe(false);
  });
});
