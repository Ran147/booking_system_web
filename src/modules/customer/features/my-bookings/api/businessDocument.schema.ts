import type { DocumentSnapshot } from "firebase/firestore";
import { z } from "zod";
import type { BookingBusiness } from "../models";

const businessDocumentSchema = z.object({
  currency: z.string().nullish(),
  name: z.string(),
  slug: z.string(),
  timeZone: z.string(),
});

export const mapBookingBusiness = (
  businessDocument: DocumentSnapshot,
): BookingBusiness => {
  const business = businessDocumentSchema.parse(businessDocument.data());

  return {
    currency: business.currency ?? null,
    id: businessDocument.id,
    name: business.name,
    slug: business.slug,
    timeZone: business.timeZone,
  };
};
