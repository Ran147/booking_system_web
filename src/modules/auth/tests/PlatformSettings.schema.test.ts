import { platformSettingsSchema } from "../models/PlatformSettings.schema";

describe("platformSettingsSchema", () => {
  it.each([20, 2])("AC-KAN-38-07: accepts %i minutes", (idleTimeoutMinutes) => {
    expect(platformSettingsSchema.parse({ idleTimeoutMinutes })).toEqual({
      idleTimeoutMinutes,
    });
  });

  it.each([
    ["missing", {}],
    ["zero", { idleTimeoutMinutes: 0 }],
    [
      "one, which would bring the warning back at once",
      { idleTimeoutMinutes: 1 },
    ],
    ["negative", { idleTimeoutMinutes: -5 }],
    ["fractional", { idleTimeoutMinutes: 1.5 }],
    ["not a number", { idleTimeoutMinutes: "20" }],
  ])("AC-KAN-38-04: rejects a value that is %s", (_caseName, document) => {
    expect(platformSettingsSchema.safeParse(document).success).toBe(false);
  });
});
