import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { SUPPORT_LIMITS } from "../constants/Support.constants";

export const createSupportTicketFormSchema = z.object({
  message: z
    .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .trim()
    .min(SUPPORT_LIMITS.MESSAGE_MIN_LENGTH, VALIDATION_MESSAGE_KEY.REQUIRED)
    .max(SUPPORT_LIMITS.MESSAGE_MAX_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG),
  subject: z
    .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .trim()
    .min(SUPPORT_LIMITS.SUBJECT_MIN_LENGTH, VALIDATION_MESSAGE_KEY.REQUIRED)
    .max(SUPPORT_LIMITS.SUBJECT_MAX_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG),
});

export type CreateSupportTicketFormSchema = z.infer<
  typeof createSupportTicketFormSchema
>;
