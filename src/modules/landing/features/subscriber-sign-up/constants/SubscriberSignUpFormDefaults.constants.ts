import { STRING } from "@/shared/constants";
import type { SubscriberSignUpFormValues } from "../models/SubscriberSignUpForm.schema";

// The email is filled in from the checkout when the form is created.
export const DEFAULT_SUBSCRIBER_SIGN_UP_FORM_VALUES = {
  businessName: STRING.EMPTY,
  businessSlug: STRING.EMPTY,
  email: STRING.EMPTY,
  firstName: STRING.EMPTY,
  lastName: STRING.EMPTY,
  password: STRING.EMPTY,
  passwordConfirmation: STRING.EMPTY,
  phone: STRING.EMPTY,
} as const satisfies SubscriberSignUpFormValues;
