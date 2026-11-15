import { z } from "zod";

export const createBookingPayloadSchema = z.object({
  businessId: z.string().min(1),
  collaboratorId: z.string().nullable().optional(),
  customerId: z.string().optional(),
  customerUserId: z.string().nullable().optional(),
  endsAt: z.string().optional(),
  // KAN-148-08 (spec KAN-145, S-2): the price and duration the customer saw.
  expectedDurationMinutes: z.number().int().positive().optional(),
  expectedPriceInCents: z.number().int().nonnegative().optional(),
  // KAN-148-06 and 07 (S-1): the same id on every retry of one checkout.
  requestId: z.uuid().optional(),
  serviceId: z.string().min(1),
  startsAt: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value))),
});
