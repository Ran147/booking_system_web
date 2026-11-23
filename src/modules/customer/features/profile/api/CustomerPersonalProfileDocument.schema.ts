import { z } from "zod";
import type { CustomerPersonalProfile } from "../models";

const personalValueSchema = z
  .string()
  .trim()
  .nullish()
  .transform((value): CustomerPersonalProfile["email"] => value || null);

// z.object strips unrelated fields before the projection enters the query cache.
export const CustomerPersonalProfileDocumentSchema = z.object({
  email: personalValueSchema,
  fullName: personalValueSchema,
  phone: personalValueSchema,
});
