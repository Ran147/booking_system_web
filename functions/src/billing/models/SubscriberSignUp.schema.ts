import { z } from "zod";
import { LANGUAGE } from "../../shared/constants/Language.constants.js";
import { PASSWORD_RULE } from "../../shared/constants/PasswordRule.constants.js";
import { STRING } from "../../shared/constants/String.constants.js";
import {
  SUBSCRIBER_SIGN_UP_FIELD_LIMIT,
  SUBSCRIBER_SIGN_UP_PATTERN,
} from "../constants/SubscriberSignUp.constants.js";

// The same field rules as the sign-up form (SubscriberSignUpForm.schema.ts),
// checked again on the server (cloud-functions-standards §3).

const signUpTokenSchema = z.string().trim().min(1);

const personNameSchema = z
  .string()
  .trim()
  .min(SUBSCRIBER_SIGN_UP_FIELD_LIMIT.PERSON_NAME_MIN_LENGTH)
  .max(SUBSCRIBER_SIGN_UP_FIELD_LIMIT.PERSON_NAME_MAX_LENGTH);

// Format only; reserved slugs are a business rule with their own reason.
const businessSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(SUBSCRIBER_SIGN_UP_FIELD_LIMIT.BUSINESS_SLUG_MIN_LENGTH)
  .max(SUBSCRIBER_SIGN_UP_FIELD_LIMIT.BUSINESS_SLUG_MAX_LENGTH)
  .regex(SUBSCRIBER_SIGN_UP_PATTERN.BUSINESS_SLUG);

const phoneSchema = z.union([
  z.literal(STRING.EMPTY),
  z
    .string()
    .trim()
    .min(SUBSCRIBER_SIGN_UP_FIELD_LIMIT.PHONE_MIN_LENGTH)
    .max(SUBSCRIBER_SIGN_UP_FIELD_LIMIT.PHONE_MAX_LENGTH)
    .regex(SUBSCRIBER_SIGN_UP_PATTERN.PHONE),
]);

const passwordSchema = z
  .string()
  .min(PASSWORD_RULE.MIN_LENGTH)
  .regex(PASSWORD_RULE.PATTERN.DIGIT)
  .regex(PASSWORD_RULE.PATTERN.LOWERCASE)
  .regex(PASSWORD_RULE.PATTERN.SYMBOL)
  .regex(PASSWORD_RULE.PATTERN.UPPERCASE);

const isTimeZone = (timeZone: string): boolean => {
  try {
    Intl.DateTimeFormat([], { timeZone });
    return true;
  } catch {
    return false;
  }
};

export const validateSignUpLinkPayloadSchema = z.object({
  signUpToken: signUpTokenSchema,
});

export const checkBusinessSlugPayloadSchema = z.object({
  businessSlug: businessSlugSchema,
  signUpToken: signUpTokenSchema,
});

export const completeSubscriberSignUpPayloadSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(SUBSCRIBER_SIGN_UP_FIELD_LIMIT.BUSINESS_NAME_MIN_LENGTH)
    .max(SUBSCRIBER_SIGN_UP_FIELD_LIMIT.BUSINESS_NAME_MAX_LENGTH),
  businessSlug: businessSlugSchema,
  firstName: personNameSchema,
  language: z.enum(Object.values(LANGUAGE)),
  lastName: personNameSchema,
  password: passwordSchema,
  phone: phoneSchema,
  signUpToken: signUpTokenSchema,
  timeZone: z.string().trim().refine(isTimeZone),
});
