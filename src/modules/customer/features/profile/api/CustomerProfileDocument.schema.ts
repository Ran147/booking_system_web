import { z } from "zod";

export const customerProfileDocumentSchema = z.object({
  email: z.string(),
  fullName: z.string(),
  phone: z.string(),
});
