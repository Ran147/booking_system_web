import type { DocumentSnapshot, Timestamp } from "firebase/firestore";
import { z } from "zod";
import { BOOKING_STATUS, CANCELLATION_ACTOR } from "@/domain";
import type { MyBooking } from "../models";

const timestampSchema = z.custom<Timestamp>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function",
);

// The cancellation note is internal to the business: it is not read (AS-4).
const bookingDocumentSchema = z.object({
  businessId: z.string(),
  cancellation: z
    .object({
      cancelledBy: z.enum([
        CANCELLATION_ACTOR.BUSINESS,
        CANCELLATION_ACTOR.CUSTOMER,
      ]),
      isPenalized: z.boolean(),
    })
    .nullable()
    .default(null),
  collaboratorName: z.string().nullable().default(null),
  endsAt: timestampSchema,
  serviceSnapshot: z.object({
    durationMinutes: z.number().int().positive(),
    name: z.string(),
    priceInCents: z.number().int().nonnegative(),
  }),
  startsAt: timestampSchema,
  status: z.enum([
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.NO_SHOW,
    BOOKING_STATUS.PENDING,
  ]),
});

export const mapMyBooking = (bookingDocument: DocumentSnapshot): MyBooking => {
  const booking = bookingDocumentSchema.parse(bookingDocument.data());

  return {
    businessId: booking.businessId,
    cancellation: booking.cancellation,
    collaboratorName: booking.collaboratorName,
    durationMinutes: booking.serviceSnapshot.durationMinutes,
    endsAt: booking.endsAt.toDate(),
    id: bookingDocument.id,
    priceInCents: booking.serviceSnapshot.priceInCents,
    serviceName: booking.serviceSnapshot.name,
    startsAt: booking.startsAt.toDate(),
    status: booking.status,
  };
};
