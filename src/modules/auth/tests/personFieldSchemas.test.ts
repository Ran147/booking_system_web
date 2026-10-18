import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { fullNameFieldSchema } from "../models/FullNameField.schema";
import {
  optionalPhoneFieldSchema,
  phoneFieldSchema,
} from "../models/PhoneField.schema";

const readFirstMessage = (
  schema:
    | typeof fullNameFieldSchema
    | typeof optionalPhoneFieldSchema
    | typeof phoneFieldSchema,
  value: string,
): string => schema.safeParse(value).error?.issues[0]?.message ?? "";

describe("fullNameFieldSchema", () => {
  it("KAN-123: accepts a full name and trims its spaces (AC-KAN-123-11)", () => {
    expect(fullNameFieldSchema.parse("  Ana Pérez  ")).toBe("Ana Pérez");
  });

  it.each([
    ["an empty name", "   ", VALIDATION_MESSAGE_KEY.REQUIRED],
    ["a 1-character name", "A", VALIDATION_MESSAGE_KEY.TOO_SHORT],
    ["an 81-character name", "A".repeat(81), VALIDATION_MESSAGE_KEY.TOO_LONG],
  ])(
    "KAN-123: rejects %s (AC-KAN-123-02, AC-KAN-123-04)",
    (_case, fullName, messageKey) => {
      expect(readFirstMessage(fullNameFieldSchema, fullName)).toBe(messageKey);
    },
  );
});

describe("phoneFieldSchema", () => {
  it("KAN-123: accepts a phone and trims its spaces (AC-KAN-123-11)", () => {
    expect(phoneFieldSchema.parse(" (506) 8888-8888 ")).toBe("(506) 8888-8888");
  });

  it.each([
    ["an empty phone", "", VALIDATION_MESSAGE_KEY.REQUIRED],
    [
      "a phone longer than 20 characters",
      "+506 (88) 88 - 88 - 88",
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    ],
    ["a phone without digits", "-------", VALIDATION_MESSAGE_KEY.PHONE_INVALID],
    ["a phone with 6 digits", "123-456", VALIDATION_MESSAGE_KEY.PHONE_INVALID],
    ["a phone with letters", "8888-ABCD", VALIDATION_MESSAGE_KEY.PHONE_INVALID],
    [
      "a phone with a + after the first character",
      "506+8888+8888",
      VALIDATION_MESSAGE_KEY.PHONE_INVALID,
    ],
  ])(
    "KAN-123: rejects %s (AC-KAN-123-04, AC-KAN-123-12, AC-KAN-123-13)",
    (_case, phone, messageKey) => {
      expect(readFirstMessage(phoneFieldSchema, phone)).toBe(messageKey);
    },
  );
});

describe("optionalPhoneFieldSchema", () => {
  it.each([
    ["an empty phone", "", ""],
    ["a missing phone", undefined, ""],
    ["a phone with only spaces", "   ", ""],
    ["a valid phone", " (506) 8888-8888 ", "(506) 8888-8888"],
  ])("KAN-123: accepts %s (AS-3)", (_case, phone, storedPhone) => {
    expect(optionalPhoneFieldSchema.parse(phone)).toBe(storedPhone);
  });

  it.each([
    ["a phone without digits", "-------", VALIDATION_MESSAGE_KEY.PHONE_INVALID],
    [
      "a phone longer than 20 characters",
      "+506 (88) 88 - 88 - 88",
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    ],
    [
      "a phone with more than 20 digits",
      "1".repeat(25),
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    ],
  ])("KAN-123: rejects %s (AS-3)", (_case, phone, messageKey) => {
    expect(readFirstMessage(optionalPhoneFieldSchema, phone)).toBe(messageKey);
  });
});
