import type { DocumentSnapshot } from "firebase/firestore";
import { z } from "zod";
import {
  BOOKING_STATUS,
  CANCELLATION_ACTOR,
  type Booking,
  type BookingCancellation,
  type BookingReschedule,
  type BookingStatus,
  type CancellationActor,
} from "@/domain";
import type { Nullable } from "@/types";
import { SCHEDULE_CONSTANTS } from "../constants";

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

const cancellationSchema = z
  .object({
    cancelledAt: timestampAdapter.optional(),
    cancelledBy: z
      .enum([CANCELLATION_ACTOR.BUSINESS, CANCELLATION_ACTOR.CUSTOMER])
      .default(CANCELLATION_ACTOR.BUSINESS),
    isPenalized: z.boolean().default(false),
    note: z.string().nullable().default(null),
  })
  .nullable()
  .default(null);

const rescheduleEntrySchema = z.object({
  changedAt: timestampAdapter,
  previousEndsAt: timestampAdapter,
  previousStartsAt: timestampAdapter,
});

const serviceSnapshotSchema = z.object({
  durationMinutes: z
    .number()
    .int()
    .positive()
    .default(SCHEDULE_CONSTANTS.DEFAULT_SLOT_DURATION_MINUTES),
  name: z.string().default(""),
  priceInCents: z.number().int().nonnegative().default(0),
});

export const businessBookingDocumentSchema = z.object({
  businessId: z.string(),
  cancellation: cancellationSchema,
  collaboratorId: z.string().nullable().default(null),
  collaboratorName: z.string().nullable().default(null),
  customerId: z.string().default(""),
  customerUserId: z.string().nullable().default(null),
  endsAt: timestampAdapter,
  notes: z.string().nullable().default(null),
  rescheduleHistory: z.array(rescheduleEntrySchema).default([]),
  serviceId: z.string().default(""),
  serviceSnapshot: serviceSnapshotSchema,
  startsAt: timestampAdapter,
  status: z
    .enum([
      BOOKING_STATUS.CANCELLED,
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.NO_SHOW,
      BOOKING_STATUS.PENDING,
    ])
    .default(BOOKING_STATUS.CONFIRMED),
});

export const mapBookingDocument = (
  documentSnapshot: DocumentSnapshot,
): Booking => {
  const parsedData = businessBookingDocumentSchema.parse(
    documentSnapshot.data() || {},
  );

  const cancellation: Nullable<BookingCancellation> = parsedData.cancellation
    ? {
        cancelledBy: parsedData.cancellation.cancelledBy as CancellationActor,
        isPenalized: parsedData.cancellation.isPenalized,
        note: parsedData.cancellation.note,
      }
    : null;

  const rescheduleHistory: BookingReschedule[] =
    parsedData.rescheduleHistory.map((item) => ({
      changedAt: item.changedAt,
      previousEndsAt: item.previousEndsAt,
      previousStartsAt: item.previousStartsAt,
    }));

  return {
    businessId: parsedData.businessId,
    cancellation,
    collaboratorId: parsedData.collaboratorId,
    collaboratorName: parsedData.collaboratorName,
    customerId: parsedData.customerId,
    customerUserId: parsedData.customerUserId,
    endsAt: parsedData.endsAt,
    id: documentSnapshot.id,
    rescheduleHistory,
    serviceId: parsedData.serviceId,
    serviceSnapshot: {
      durationMinutes: parsedData.serviceSnapshot.durationMinutes,
      name: parsedData.serviceSnapshot.name,
      priceInCents: parsedData.serviceSnapshot.priceInCents,
    },
    startsAt: parsedData.startsAt,
    status: parsedData.status as BookingStatus,
  };
};
