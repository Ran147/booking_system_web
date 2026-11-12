import type { DocumentSnapshot, Timestamp } from "firebase/firestore";
import { z } from "zod";
import type {
  AuditLogActionType,
  AuditLogEntry,
  AuditLogTargetType,
} from "@/domain";

const timestampSchema = z.custom<Timestamp>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function",
);

export const auditLogDocumentSchema = z.object({
  actionType: z.string(),
  actorEmail: z.string().default(""),
  actorUserId: z.string().default(""),
  after: z.record(z.string(), z.unknown()).nullable().default(null),
  before: z.record(z.string(), z.unknown()).nullable().default(null),
  createdAt: z.union([z.instanceof(Date), timestampSchema]),
  reason: z.string().nullable().default(null),
  targetId: z.string().default(""),
  targetName: z.string().default(""),
  targetType: z.string().default("business"),
});

export const mapAuditLogEntry = (snapshot: DocumentSnapshot): AuditLogEntry => {
  const parsed = auditLogDocumentSchema.parse(snapshot.data());
  const createdAt =
    parsed.createdAt instanceof Date
      ? parsed.createdAt
      : parsed.createdAt.toDate();

  return {
    actionType: parsed.actionType as AuditLogActionType,
    actorEmail: parsed.actorEmail,
    actorUserId: parsed.actorUserId,
    after: parsed.after,
    before: parsed.before,
    createdAt,
    id: snapshot.id,
    reason: parsed.reason,
    targetId: parsed.targetId,
    targetName: parsed.targetName,
    targetType: parsed.targetType as AuditLogTargetType,
  };
};
