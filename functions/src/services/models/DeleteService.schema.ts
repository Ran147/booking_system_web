import { z } from "zod";

export const deleteServicePayloadSchema = z.object({
  businessId: z.string().trim().min(1),
  serviceId: z.string().trim().min(1),
});
