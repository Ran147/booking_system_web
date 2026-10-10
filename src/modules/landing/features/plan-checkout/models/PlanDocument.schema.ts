import { z } from "zod";
import { PLAN_STATUS } from "@/shared/domain";
import { PLAN_BILLING_PERIOD } from "../constants/PlanDetail.constants";

// plans/{planId} as the admin writes it (KAN-180 spec "Data"). Limits are
// optional so a plan saved before maxCollaborators (KAN-85) still reads.
export const planDocumentSchema = z.object({
  billingPeriod: z.enum([
    PLAN_BILLING_PERIOD.ANNUAL,
    PLAN_BILLING_PERIOD.MONTHLY,
  ]),
  features: z.array(z.string()).default([]),
  limits: z
    .object({
      maxBookings: z.number().int().nonnegative().optional(),
      maxCollaborators: z.number().int().nonnegative().optional(),
    })
    .default({}),
  name: z.string().min(1),
  priceInCents: z.number().int().nonnegative(),
  status: z.enum([PLAN_STATUS.ACTIVE, PLAN_STATUS.INACTIVE]),
});

export type PlanDocument = z.infer<typeof planDocumentSchema>;
