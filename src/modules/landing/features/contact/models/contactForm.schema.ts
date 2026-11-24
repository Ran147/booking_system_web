import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { CONTACT_FORM_CONSTANTS } from "../constants/contactForm.constants";

export const contactFormSchema = z.object({
  email: z
    .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .email(VALIDATION_MESSAGE_KEY.EMAIL_INVALID),
  message: z
    .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .min(
      CONTACT_FORM_CONSTANTS.FIELD_LIMITS.MESSAGE_MIN_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_SHORT,
    )
    .max(
      CONTACT_FORM_CONSTANTS.FIELD_LIMITS.MESSAGE_MAX_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    ),
  name: z
    .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .min(
      CONTACT_FORM_CONSTANTS.FIELD_LIMITS.NAME_MIN_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_SHORT,
    )
    .max(
      CONTACT_FORM_CONSTANTS.FIELD_LIMITS.NAME_MAX_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    ),
  recaptchaToken: z
    .string({ message: VALIDATION_MESSAGE_KEY.RECAPTCHA_REQUIRED })
    .min(1, VALIDATION_MESSAGE_KEY.RECAPTCHA_REQUIRED),
  subject: z
    .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .min(
      CONTACT_FORM_CONSTANTS.FIELD_LIMITS.SUBJECT_MIN_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_SHORT,
    )
    .max(
      CONTACT_FORM_CONSTANTS.FIELD_LIMITS.SUBJECT_MAX_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    ),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
