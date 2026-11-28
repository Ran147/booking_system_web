import { z } from "zod";
import { FULL_NAME_RULE } from "../../shared/constants/FullNameRule.constants.js";
import { LANGUAGE } from "../../shared/constants/Language.constants.js";
import { PASSWORD_RULE } from "../../shared/constants/PasswordRule.constants.js";
import { PHONE_RULE } from "../../shared/constants/PhoneRule.constants.js";

// The same field rules as the customer sign-up form, checked again on the
// server (cloud-functions-standards §3, forms-validation-standards §6).

const countDigits = (phone: string): number =>
  phone.match(PHONE_RULE.PATTERN.DIGIT)?.length ?? 0;

const phoneSchema = z
  .string()
  .trim()
  .max(PHONE_RULE.MAX_LENGTH)
  .regex(PHONE_RULE.PATTERN.ALLOWED_CHARACTERS)
  .refine(
    (phone) =>
      countDigits(phone) >= PHONE_RULE.MIN_DIGITS &&
      countDigits(phone) <= PHONE_RULE.MAX_DIGITS,
  );

const passwordSchema = z
  .string()
  .min(PASSWORD_RULE.MIN_LENGTH)
  .regex(PASSWORD_RULE.PATTERN.DIGIT)
  .regex(PASSWORD_RULE.PATTERN.LOWERCASE)
  .regex(PASSWORD_RULE.PATTERN.SYMBOL)
  .regex(PASSWORD_RULE.PATTERN.UPPERCASE);

export const completeCustomerSignUpPayloadSchema = z.object({
  // The page to return to after signing in; Firebase itself rejects a domain
  // that is not authorized in the project.
  continueUrl: z.url(),
  // AS-5: stored trimmed and in lowercase.
  email: z.string().trim().toLowerCase().pipe(z.email()),
  fullName: z
    .string()
    .trim()
    .min(FULL_NAME_RULE.MIN_LENGTH)
    .max(FULL_NAME_RULE.MAX_LENGTH),
  language: z.enum([LANGUAGE.EN, LANGUAGE.ES]),
  password: passwordSchema,
  phone: phoneSchema,
  recaptchaToken: z.string().min(1),
});
