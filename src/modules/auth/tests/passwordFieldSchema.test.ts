import { VALIDATION_MESSAGE_KEY } from "@/shared/constants";
import { passwordFieldSchema } from "../models/PasswordField.schema";

const readFirstMessage = (password: string): string =>
  passwordFieldSchema.safeParse(password).error?.issues[0]?.message ?? "";

describe("passwordFieldSchema", () => {
  it("accepts a password that meets every rule", () => {
    expect(passwordFieldSchema.safeParse("Reserva!2026").success).toBe(true);
  });

  it("asks for a password when it is empty", () => {
    expect(readFirstMessage("")).toBe(VALIDATION_MESSAGE_KEY.REQUIRED);
  });

  it("rejects a password that misses a rule as too weak", () => {
    expect(readFirstMessage("reserva2026")).toBe(
      VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK,
    );
  });
});
