import { describe, expect, it } from "vitest";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { contactFormSchema } from "../models/contactForm.schema";

describe("contactFormSchema", () => {
  const validPayload = {
    email: "visitor@example.com",
    message: "This is a valid inquiry message with sufficient length.",
    name: "John Doe",
    recaptchaToken: "valid-token-123",
    subject: "Business demo request",
  };

  it("accepts valid contact form data", () => {
    const result = contactFormSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects empty name with required error", () => {
    const result = contactFormSchema.safeParse({
      ...validPayload,
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        VALIDATION_MESSAGE_KEY.REQUIRED,
      );
    }
  });

  it("rejects name shorter than 2 characters with tooShort error", () => {
    const result = contactFormSchema.safeParse({
      ...validPayload,
      name: "J",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        VALIDATION_MESSAGE_KEY.TOO_SHORT,
      );
    }
  });

  it("rejects name longer than 100 characters with tooLong error", () => {
    const result = contactFormSchema.safeParse({
      ...validPayload,
      name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        VALIDATION_MESSAGE_KEY.TOO_LONG,
      );
    }
  });

  it("rejects invalid email address with emailInvalid error", () => {
    const result = contactFormSchema.safeParse({
      ...validPayload,
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        VALIDATION_MESSAGE_KEY.EMAIL_INVALID,
      );
    }
  });

  it("rejects subject shorter than 3 characters with tooShort error", () => {
    const result = contactFormSchema.safeParse({
      ...validPayload,
      subject: "Hi",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        VALIDATION_MESSAGE_KEY.TOO_SHORT,
      );
    }
  });

  it("rejects message shorter than 10 characters with tooShort error", () => {
    const result = contactFormSchema.safeParse({
      ...validPayload,
      message: "Short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        VALIDATION_MESSAGE_KEY.TOO_SHORT,
      );
    }
  });

  it("rejects missing recaptcha token with recaptchaRequired error", () => {
    const result = contactFormSchema.safeParse({
      ...validPayload,
      recaptchaToken: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        VALIDATION_MESSAGE_KEY.RECAPTCHA_REQUIRED,
      );
    }
  });
});
