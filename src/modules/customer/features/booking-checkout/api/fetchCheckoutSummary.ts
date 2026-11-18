import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION, FIRESTORE_OPERATOR } from "@/constants";
import { BUSINESS_STATUS, SERVICE_STATUS } from "@/domain";
import { readBookableService } from "@/modules/customer/features/availability";
import { firestore } from "@/services";
import type { Nullable } from "@/types";
import type { CheckoutSummary } from "../models/bookingCheckout.model";
import { resolveServicePrice } from "../utils/resolveServicePrice";

const DEFAULT_CURRENCY = "CRC";

// P-1 = A: a policy with the provisional shape, or none.
const bookingPolicySchema = z.object({
  cancellationWindowHours: z.number().nonnegative(),
  penaltyDescription: z.string().min(1),
});

const checkoutBusinessSchema = z.object({
  bookingPolicy: z.unknown().optional(),
  currency: z.string().nullish(),
  name: z.string().min(1),
  status: z.string(),
  timeZone: z.string().min(1),
});

const checkoutServiceSchema = z.object({
  collaboratorSelection: z.string().nullish(),
  discounts: z.unknown().optional(),
  durationMinutes: z.number().positive(),
  name: z.string().min(1),
  priceInCents: z.number().int().nonnegative(),
  status: z.string(),
});

/**
 * The business (by its slug) and the service of the checkout. `null` when
 * either is missing or cannot be booked: AC-KAN-146-04 shows not found.
 */
export const fetchCheckoutSummary = async (
  businessSlug: string,
  serviceId: string,
  now: Date,
): Promise<Nullable<CheckoutSummary>> => {
  const businessSnapshot = await getDocs(
    query(
      collection(firestore, FIRESTORE_COLLECTION.BUSINESSES),
      where("slug", FIRESTORE_OPERATOR.EQUAL, businessSlug),
      limit(1),
    ),
  );
  const [businessDocument] = businessSnapshot.docs;
  if (!businessDocument) return null;
  const business = checkoutBusinessSchema.parse(businessDocument.data());
  if (business.status !== BUSINESS_STATUS.ACTIVE) return null;

  // A deactivated service is denied to a customer by the rules: that also
  // means not found, not an error with retry.
  const serviceDocument = await readBookableService(
    businessDocument.id,
    serviceId,
  );
  if (!serviceDocument) return null;
  const service = checkoutServiceSchema.parse(serviceDocument.data());
  if (service.status !== SERVICE_STATUS.ACTIVE) return null;

  const policy = bookingPolicySchema.safeParse(business.bookingPolicy);
  return {
    basePriceInCents: service.priceInCents,
    businessId: businessDocument.id,
    businessName: business.name,
    currency: business.currency ?? DEFAULT_CURRENCY,
    durationMinutes: service.durationMinutes,
    finalPriceInCents: resolveServicePrice(
      service.priceInCents,
      service.discounts,
      business.timeZone,
      now,
    ),
    hasCollaborators: Boolean(service.collaboratorSelection),
    policy: policy.success ? policy.data : null,
    serviceName: service.name,
    timeZone: business.timeZone,
  };
};
