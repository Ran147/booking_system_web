import { z } from "zod";

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const getAvailabilityPayloadSchema = z.object({
  businessId: z.string().min(1),
  collaboratorId: z.string().min(1).nullable().optional(),
  date: z.string().regex(LOCAL_DATE_PATTERN),
  serviceId: z.string().min(1),
});
