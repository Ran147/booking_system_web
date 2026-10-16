import type { DocumentSnapshot } from "firebase/firestore";
import { z } from "zod";
import type { BookingBusiness } from "../models";

const businessDocumentSchema = z.object({
  currency: z.string(),
  name: z.string(),
  slug: z.string(),
  timeZone: z.string(),
});

export const mapBookingBusiness = (
  businessDocument: DocumentSnapshot,
): BookingBusiness => ({
  ...businessDocumentSchema.parse(businessDocument.data()),
  id: businessDocument.id,
});
