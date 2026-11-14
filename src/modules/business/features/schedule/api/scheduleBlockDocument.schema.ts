import type { DocumentSnapshot } from "firebase/firestore";
import { z } from "zod";
import type { ScheduleBlock } from "../models";

const timestampAdapter = z.unknown().transform((value): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string") {
    return new Date(value);
  }
  return new Date();
});

export const scheduleBlockDocumentSchema = z.object({
  businessId: z.string(),
  collaboratorId: z.string().nullable().default(null),
  createdAt: timestampAdapter.optional(),
  endsAt: timestampAdapter,
  isFullDay: z.boolean().default(false),
  reason: z.string().nullable().default(null),
  startsAt: timestampAdapter,
  updatedAt: timestampAdapter.optional(),
});

export const mapScheduleBlockDocument = (
  documentSnapshot: DocumentSnapshot,
): ScheduleBlock => {
  const parsedData = scheduleBlockDocumentSchema.parse(
    documentSnapshot.data() || {},
  );

  return {
    businessId: parsedData.businessId,
    collaboratorId: parsedData.collaboratorId,
    createdAt: parsedData.createdAt ?? new Date(),
    endsAt: parsedData.endsAt,
    id: documentSnapshot.id,
    isFullDay: parsedData.isFullDay,
    reason: parsedData.reason,
    startsAt: parsedData.startsAt,
    updatedAt: parsedData.updatedAt ?? new Date(),
  };
};
