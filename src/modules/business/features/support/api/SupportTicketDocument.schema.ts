import type { DocumentSnapshot, Timestamp } from "firebase/firestore";
import { z } from "zod";
import {
  SUPPORT_TICKET_STATUS,
  type SupportTicket,
  type SupportTicketReply,
} from "@/domain";

const timestampSchema = z
  .union([
    z.date(),
    z.string().transform((stringValue) => new Date(stringValue)),
    z.custom<Timestamp>(
      (value) =>
        typeof value === "object" &&
        value !== null &&
        "toDate" in value &&
        typeof (value as { toDate: unknown }).toDate === "function",
    ),
  ])
  .transform((value) => (value instanceof Date ? value : value.toDate()));

const nullableTimestampSchema = z
  .union([
    z.date(),
    z.string().transform((stringValue) => new Date(stringValue)),
    z.custom<Timestamp>(
      (value) =>
        typeof value === "object" &&
        value !== null &&
        "toDate" in value &&
        typeof (value as { toDate: unknown }).toDate === "function",
    ),
  ])
  .transform((value) => (value instanceof Date ? value : value.toDate()))
  .nullable()
  .optional()
  .default(null);

const supportTicketReplySchema = z.object({
  body: z.string(),
  emailFailed: z.boolean().optional().default(false),
  id: z.string().default(""),
  sentAt: timestampSchema,
  sentByEmail: z.string().default(""),
  sentByUserId: z.string().default(""),
});

export const supportTicketDocumentSchema = z.object({
  businessId: z.string(),
  businessName: z.string().default(""),
  createdAt: timestampSchema,
  createdByUserId: z.string(),
  message: z.string(),
  ownerEmail: z.string().nullable().optional().default(null),
  replies: z.array(supportTicketReplySchema).default([]),
  resolvedAt: nullableTimestampSchema,
  status: z.enum([
    SUPPORT_TICKET_STATUS.IN_PROGRESS,
    SUPPORT_TICKET_STATUS.OPEN,
    SUPPORT_TICKET_STATUS.RESOLVED,
  ]),
  subject: z.string(),
  updatedAt: timestampSchema,
});

export const mapSupportTicketDocument = (
  documentSnapshot: DocumentSnapshot,
): SupportTicket => {
  const parsed = supportTicketDocumentSchema.parse(documentSnapshot.data());

  const replies: SupportTicketReply[] = parsed.replies.map((reply, index) => ({
    body: reply.body,
    emailFailed: reply.emailFailed,
    id: reply.id || `reply-${index}`,
    sentAt: reply.sentAt,
    sentByEmail: reply.sentByEmail,
    sentByUserId: reply.sentByUserId,
  }));

  return {
    businessId: parsed.businessId,
    businessName: parsed.businessName,
    createdAt: parsed.createdAt,
    createdByUserId: parsed.createdByUserId,
    id: documentSnapshot.id,
    message: parsed.message,
    ownerEmail: parsed.ownerEmail,
    replies,
    resolvedAt: parsed.resolvedAt,
    status: parsed.status,
    subject: parsed.subject,
    updatedAt: parsed.updatedAt,
  };
};
