import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { CHANGE_PASSWORD_ERROR_KEY } from "../constants/ChangePassword.constants";
import { changePasswordFormSchema } from "../models";

const VALID_FORM_VALUES = {
  confirmPassword: "NewPassword1!",
  currentPassword: "CurrentPassword1!",
  newPassword: "NewPassword1!",
};

describe("changePasswordFormSchema", () => {
  it("KAN-53: accepts a strong new password and matching confirmation", () => {
    expect(changePasswordFormSchema.safeParse(VALID_FORM_VALUES).success).toBe(
      true,
    );
  });

  it("KAN-53: rejects empty fields", () => {
    const result = changePasswordFormSchema.safeParse({
      confirmPassword: "",
      currentPassword: "",
      newPassword: "",
    });

    const requiredPaths = result.error?.issues
      .filter((issue) => issue.message === VALIDATION_MESSAGE_KEY.REQUIRED)
      .map((issue) => issue.path[0]);

    expect(requiredPaths).toEqual(
      expect.arrayContaining([
        "confirmPassword",
        "currentPassword",
        "newPassword",
      ]),
    );
  });

  it("KAN-53: rejects a weak new password", () => {
    const result = changePasswordFormSchema.safeParse({
      ...VALID_FORM_VALUES,
      confirmPassword: "weak",
      newPassword: "weak",
    });

    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK,
    );
  });

  it("KAN-53: rejects a confirmation that does not match", () => {
    const result = changePasswordFormSchema.safeParse({
      ...VALID_FORM_VALUES,
      confirmPassword: "DifferentPassword1!",
    });

    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      CHANGE_PASSWORD_ERROR_KEY.CONFIRMATION_MISMATCH,
    );
  });

  it("KAN-53: rejects reusing the current password", () => {
    const result = changePasswordFormSchema.safeParse({
      ...VALID_FORM_VALUES,
      currentPassword: VALID_FORM_VALUES.newPassword,
    });

    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      CHANGE_PASSWORD_ERROR_KEY.SAME_AS_CURRENT,
    );
  });
});
