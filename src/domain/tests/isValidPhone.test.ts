import { isValidPhone } from "@/domain";

describe("isValidPhone", () => {
  it.each([
    "(506) 8888-8888",
    "+1 555 123 4567",
    "88888888",
    "1234567",
    "123456789012345",
  ])("KAN-123: accepts the phone %s (AS-3)", (phone) => {
    expect(isValidPhone(phone)).toBe(true);
  });

  it.each([
    ["only hyphens", "-------"],
    ["only parentheses", "((((((("],
    ["6 digits", "123456"],
    ["16 digits", "1234567890123456"],
    ["letters", "8888-ABCD"],
    ["a + after the first character", "12+34+567+89"],
    ["a + at the end", "1234567+++"],
    ["more than 20 characters", "+506 (88) 88 - 88 - 88"],
    ["an empty value", ""],
  ])("KAN-123: rejects %s (AS-3)", (_case, phone) => {
    expect(isValidPhone(phone)).toBe(false);
  });
});
