import { z } from "zod";
import { CONTACT_MESSAGE_LIMITS } from "../constants/ContactMessage.constants.js";

export const sendContactMessageSchema = z.object({
  email: z.string().trim().email(),
  message: z
    .string()
    .trim()
    .min(CONTACT_MESSAGE_LIMITS.MESSAGE_MIN_LENGTH)
    .max(CONTACT_MESSAGE_LIMITS.MESSAGE_MAX_LENGTH),
  name: z
    .string()
    .trim()
    .min(CONTACT_MESSAGE_LIMITS.NAME_MIN_LENGTH)
    .max(CONTACT_MESSAGE_LIMITS.NAME_MAX_LENGTH),
  recaptchaToken: z.string().min(1),
  subject: z
    .string()
    .trim()
    .min(CONTACT_MESSAGE_LIMITS.SUBJECT_MIN_LENGTH)
    .max(CONTACT_MESSAGE_LIMITS.SUBJECT_MAX_LENGTH),
});
