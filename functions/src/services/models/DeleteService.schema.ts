import { z } from "zod";
import { BUSINESS_STATUS } from "../../shared/constants/BusinessStatus.constants.js";
import { SERVICE_STATUS } from "../../shared/constants/ServiceStatus.constants.js";

export const deleteServicePayloadSchema = z.object({
  businessId: z.string().trim().min(1),
  serviceId: z.string().trim().min(1),
});

export const businessStatusDocumentSchema = z.object({
  status: z
    .enum([
      BUSINESS_STATUS.ACTIVE,
      BUSINESS_STATUS.INACTIVE,
      BUSINESS_STATUS.PENDING,
      BUSINESS_STATUS.REJECTED,
      BUSINESS_STATUS.SUSPENDED,
    ])
    .optional(),
});

export const serviceStatusDocumentSchema = z.object({
  status: z.enum([SERVICE_STATUS.ACTIVE, SERVICE_STATUS.INACTIVE]).optional(),
});
