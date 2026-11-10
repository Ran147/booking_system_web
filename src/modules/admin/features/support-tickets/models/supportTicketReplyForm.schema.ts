import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import {
  SUPPORT_TICKET_MAX_REPLY_LENGTH,
  SUPPORT_TICKET_MIN_REPLY_LENGTH,
} from "../constants";

export const supportTicketReplyFormSchema = z.object({
  body: z
    .string()
    .trim()
    .min(SUPPORT_TICKET_MIN_REPLY_LENGTH, VALIDATION_MESSAGE_KEY.REQUIRED)
    .max(SUPPORT_TICKET_MAX_REPLY_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG),
});

export type SupportTicketReplyFormValues = z.infer<
  typeof supportTicketReplyFormSchema
>;
