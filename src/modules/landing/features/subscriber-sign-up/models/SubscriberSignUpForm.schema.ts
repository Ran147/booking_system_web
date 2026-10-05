import { z } from "zod";
import { passwordFieldSchema } from "@/modules/auth";
import { STRING, VALIDATION_MESSAGE_KEY } from "@/shared/constants";
import { isReservedBusinessSlug } from "@/shared/domain";
import {
  SUBSCRIBER_SIGN_UP_FIELD_LIMIT,
  SUBSCRIBER_SIGN_UP_MESSAGE_KEY,
  SUBSCRIBER_SIGN_UP_PATTERN,
} from "../constants/SubscriberSignUpForm.constants";

const personNameSchema = z
  .string()
  .trim()
  .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
  .min(
    SUBSCRIBER_SIGN_UP_FIELD_LIMIT.PERSON_NAME_MIN_LENGTH,
    VALIDATION_MESSAGE_KEY.TOO_SHORT,
  )
  .max(
    SUBSCRIBER_SIGN_UP_FIELD_LIMIT.PERSON_NAME_MAX_LENGTH,
    VALIDATION_MESSAGE_KEY.TOO_LONG,
  );

// Phone is optional (AS-1): an empty value is accepted, anything else must
// follow AS-3.
const phoneSchema = z.union([
  z.literal(STRING.EMPTY),
  z
    .string()
    .trim()
    .min(
      SUBSCRIBER_SIGN_UP_FIELD_LIMIT.PHONE_MIN_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_SHORT,
    )
    .max(
      SUBSCRIBER_SIGN_UP_FIELD_LIMIT.PHONE_MAX_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    )
    .regex(
      SUBSCRIBER_SIGN_UP_PATTERN.PHONE,
      SUBSCRIBER_SIGN_UP_MESSAGE_KEY.PHONE_INVALID,
    ),
]);

const businessSlugSchema = z
  .string()
  .trim()
  .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
  .min(
    SUBSCRIBER_SIGN_UP_FIELD_LIMIT.BUSINESS_SLUG_MIN_LENGTH,
    VALIDATION_MESSAGE_KEY.TOO_SHORT,
  )
  .max(
    SUBSCRIBER_SIGN_UP_FIELD_LIMIT.BUSINESS_SLUG_MAX_LENGTH,
    VALIDATION_MESSAGE_KEY.TOO_LONG,
  )
  .regex(
    SUBSCRIBER_SIGN_UP_PATTERN.BUSINESS_SLUG,
    SUBSCRIBER_SIGN_UP_MESSAGE_KEY.SLUG_INVALID,
  )
  .refine(
    (businessSlug) => !isReservedBusinessSlug(businessSlug),
    SUBSCRIBER_SIGN_UP_MESSAGE_KEY.SLUG_RESERVED,
  );

export const subscriberSignUpFormSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
      .min(
        SUBSCRIBER_SIGN_UP_FIELD_LIMIT.BUSINESS_NAME_MIN_LENGTH,
        VALIDATION_MESSAGE_KEY.TOO_SHORT,
      )
      .max(
        SUBSCRIBER_SIGN_UP_FIELD_LIMIT.BUSINESS_NAME_MAX_LENGTH,
        VALIDATION_MESSAGE_KEY.TOO_LONG,
      ),
    businessSlug: businessSlugSchema,
    // Comes from the checkout and is read-only here (AC-KAN-25-14).
    email: z.string(),
    firstName: personNameSchema,
    lastName: personNameSchema,
    password: passwordFieldSchema,
    passwordConfirmation: z.string().min(1, VALIDATION_MESSAGE_KEY.REQUIRED),
    phone: phoneSchema,
  })
  .refine(
    (formValues) => formValues.password === formValues.passwordConfirmation,
    {
      message: SUBSCRIBER_SIGN_UP_MESSAGE_KEY.PASSWORD_MISMATCH,
      path: ["passwordConfirmation"],
    },
  );

export type SubscriberSignUpFormValues = z.infer<
  typeof subscriberSignUpFormSchema
>;
