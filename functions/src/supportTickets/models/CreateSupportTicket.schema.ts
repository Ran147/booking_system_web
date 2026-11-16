import { z } from "zod";
import { SUPPORT_TICKET_LIMITS } from "../constants/CreateSupportTicketError.constants.js";

export const createSupportTicketPayloadSchema = z.object({
  businessId: z.string().trim().min(1),
  message: z
    .string()
    .trim()
    .min(SUPPORT_TICKET_LIMITS.MESSAGE_MIN_LENGTH)
    .max(SUPPORT_TICKET_LIMITS.MESSAGE_MAX_LENGTH),
  subject: z
    .string()
    .trim()
    .min(SUPPORT_TICKET_LIMITS.SUBJECT_MIN_LENGTH)
    .max(SUPPORT_TICKET_LIMITS.SUBJECT_MAX_LENGTH),
});
