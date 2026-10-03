import { z } from "zod";
import { PLAN_STATUS } from "@/shared/domain";

export const PlanDocumentSchema = z.object({
  billingPeriod: z.enum(["annual", "monthly"]),
  features: z.array(z.string()).default([]),
  limits: z.object({
    maxBookings: z.number().int().nonnegative(),
  }),
  name: z.string().min(1),
  priceInCents: z.number().int().nonnegative(),
  status: z.enum([PLAN_STATUS.ACTIVE, PLAN_STATUS.INACTIVE]),
});

export type PlanDocumentInput = z.infer<typeof PlanDocumentSchema>;
