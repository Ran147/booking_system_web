import type {
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { z } from "zod";
import { SERVICE_STATUS } from "@/domain";
import type { ServiceDetail } from "../models/ServiceDetail.interface";
import type { ServiceListItem } from "../models/ServiceListItem.interface";

const discountDocumentSchema = z.object({
  endsAt: z.unknown().transform((value) => {
    if (value instanceof Date) {
      return value;
    }
    if (
      value &&
      typeof value === "object" &&
      "toDate" in value &&
      typeof (value as { toDate: () => Date }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === "string") {
      return new Date(value);
    }
    return new Date(value as string | number);
  }),
  startsAt: z.unknown().transform((value) => {
    if (value instanceof Date) {
      return value;
    }
    if (
      value &&
      typeof value === "object" &&
      "toDate" in value &&
      typeof (value as { toDate: () => Date }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === "string") {
      return new Date(value);
    }
    return new Date(value as string | number);
  }),
  type: z.enum(["fixed_amount", "percentage"]),
  value: z.number(),
});

const serviceDocumentSchema = z.object({
  description: z.string().optional(),
  discounts: z.array(discountDocumentSchema).optional().default([]),
  durationMinutes: z.number().int().positive(),
  name: z.string(),
  priceInCents: z.number().int().nonnegative(),
  status: z.enum([SERVICE_STATUS.ACTIVE, SERVICE_STATUS.INACTIVE]),
});

const serviceDetailDocumentSchema = z.object({
  collaboratorSelection: z.enum(["automatic", "customer_choice"]).optional(),
  description: z.string().optional().default(""),
  discounts: z.array(discountDocumentSchema).optional().default([]),
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
    discounts: parsedData.discounts,
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
    collaboratorSelection: parsedData.collaboratorSelection,
    description: parsedData.description,
    discounts: parsedData.discounts,
    durationMinutes: parsedData.durationMinutes,
    features: parsedData.features,
    id: serviceDocument.id,
    imageUrl: parsedData.imageUrl,
    name: parsedData.name,
    priceInCents: parsedData.priceInCents,
    status: parsedData.status,
  };
};
