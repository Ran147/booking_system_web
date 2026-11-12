import { z } from "zod";
import { SUPPORT_TICKET_LIMITS } from "../constants/SupportTicketLimits.constants.js";

export const resolveSupportTicketPayloadSchema = z.object({
  ticketId: z.string().trim().min(SUPPORT_TICKET_LIMITS.REPLY_MIN_LENGTH),
});
