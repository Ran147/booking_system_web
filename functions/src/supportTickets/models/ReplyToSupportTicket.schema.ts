import { z } from "zod";
import { SUPPORT_TICKET_LIMITS } from "../constants/SupportTicketLimits.constants.js";

export const replyToSupportTicketPayloadSchema = z.object({
  body: z
    .string()
    .trim()
    .min(SUPPORT_TICKET_LIMITS.REPLY_MIN_LENGTH)
    .max(SUPPORT_TICKET_LIMITS.REPLY_MAX_LENGTH),
  ticketId: z.string().trim().min(SUPPORT_TICKET_LIMITS.REPLY_MIN_LENGTH),
});
