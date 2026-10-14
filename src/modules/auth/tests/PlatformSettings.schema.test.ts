import { platformSettingsSchema } from "../models/PlatformSettings.schema";

describe("platformSettingsSchema", () => {
  it("AC-KAN-38-07: accepts a positive whole number of minutes", () => {
    expect(platformSettingsSchema.parse({ idleTimeoutMinutes: 20 })).toEqual({
      idleTimeoutMinutes: 20,
    });
  });

  it.each([
    ["missing", {}],
    ["zero", { idleTimeoutMinutes: 0 }],
    ["negative", { idleTimeoutMinutes: -5 }],
    ["fractional", { idleTimeoutMinutes: 1.5 }],
    ["not a number", { idleTimeoutMinutes: "20" }],
  ])("AC-KAN-38-04: rejects a value that is %s", (_caseName, document) => {
    expect(platformSettingsSchema.safeParse(document).success).toBe(false);
  });
});
