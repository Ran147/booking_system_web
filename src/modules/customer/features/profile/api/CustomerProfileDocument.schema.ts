import type { DocumentSnapshot } from "firebase/firestore";
import { z } from "zod";
import type { CustomerProfile } from "../models";

const optionalProfileValueSchema = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => value || null);

const customerProfileDocumentSchema = z.object({
  email: optionalProfileValueSchema,
  fullName: optionalProfileValueSchema,
  phone: optionalProfileValueSchema,
});

export const mapCustomerProfile = (
  profileDocument: DocumentSnapshot,
): CustomerProfile =>
  customerProfileDocumentSchema.parse(profileDocument.data());
