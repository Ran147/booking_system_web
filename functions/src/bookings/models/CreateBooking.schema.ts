import { z } from "zod";

export const createBookingPayloadSchema = z.object({
  businessId: z.string().min(1),
  collaboratorId: z.string().nullable().optional(),
  customerId: z.string().min(1),
  customerUserId: z.string().nullable().optional(),
  endsAt: z.string().optional(),
  serviceId: z.string().min(1),
  startsAt: z.string().min(1),
});
