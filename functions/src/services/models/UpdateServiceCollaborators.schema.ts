import { z } from "zod";

export const updateServiceCollaboratorsPayloadSchema = z.object({
  businessId: z.string().min(1),
  collaboratorIds: z.array(z.string()),
  collaboratorSelection: z
    .enum(["customer_choice", "automatic"])
    .nullable()
    .optional(),
  serviceId: z.string().min(1),
});
