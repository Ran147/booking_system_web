import type {
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { z } from "zod";
import { SERVICE_STATUS } from "@/domain";
import type { ServiceDetail } from "../models/ServiceDetail.interface";
import type { ServiceListItem } from "../models/ServiceListItem.interface";

const serviceDocumentSchema = z.object({
  description: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  name: z.string(),
  priceInCents: z.number().int().nonnegative(),
  status: z.enum([SERVICE_STATUS.ACTIVE, SERVICE_STATUS.INACTIVE]),
});

const serviceDetailDocumentSchema = z.object({
  description: z.string().optional().default(""),
  durationMinutes: z.number().int().positive(),
  features: z.array(z.string()).optional().default([]),
  imageUrl: z.string().nullable().optional().default(null),
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

export const mapServiceDetail = (
  serviceDocument: DocumentSnapshot,
): ServiceDetail => {
  const parsedData = serviceDetailDocumentSchema.parse(serviceDocument.data());
  return {
    description: parsedData.description,
    durationMinutes: parsedData.durationMinutes,
    features: parsedData.features,
    id: serviceDocument.id,
    imageUrl: parsedData.imageUrl,
    name: parsedData.name,
    priceInCents: parsedData.priceInCents,
    status: parsedData.status,
  };
};
