import type { QueryDocumentSnapshot } from "firebase/firestore";
import { z } from "zod";
import { SERVICE_STATUS } from "@/domain";
import type { ServiceListItem } from "../models/ServiceListItem.interface";

const serviceDocumentSchema = z.object({
  description: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  name: z.string(),
  priceInCents: z.number().int().nonnegative(),
  status: z.enum([SERVICE_STATUS.ACTIVE, SERVICE_STATUS.INACTIVE]),
});

export const mapServiceListItem = (
  serviceDocument: QueryDocumentSnapshot,
): ServiceListItem => {
  const parsedData = serviceDocumentSchema.parse(serviceDocument.data());
  return {
    description: parsedData.description,
    durationMinutes: parsedData.durationMinutes,
    id: serviceDocument.id,
    name: parsedData.name,
    priceInCents: parsedData.priceInCents,
    status: parsedData.status,
  };
};
