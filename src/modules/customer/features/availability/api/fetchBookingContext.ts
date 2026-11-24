import { FirebaseError } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type DocumentSnapshot,
} from "firebase/firestore";
import { z } from "zod";
import {
  FIREBASE_ERROR_CODE,
  FIRESTORE_COLLECTION,
  FIRESTORE_OPERATOR,
} from "@/constants";
import { firestore } from "@/services";
import type { Nullable } from "@/types";
import type { BookingContext } from "../models/availability.model";

const timeRangeSchema = z.object({
  closesAt: z.string(),
  opensAt: z.string(),
});

// Only the fields the step reads (spec P5-8); the rules make both public.
const bookingBusinessSchema = z.object({
  businessHours: z
    .record(z.string(), z.array(timeRangeSchema).nullable())
    .nullish()
    .transform((hours) => hours ?? {}),
  currency: z.string().nullish(),
  timeZone: z.string().min(1),
});

const bookingServiceSchema = z.object({
  durationMinutes: z.number().positive(),
  name: z.string().min(1),
});

/**
 * The service of the booking flow, or `null` when it cannot be booked. The
 * rules let a customer read only active services, so a deactivated or
 * missing one is denied: that denial means "service unavailable"
 * (AC-KAN-140-03). Any other failure, such as no network, still throws.
 */
export const readBookableService = async (
  businessId: string,
  serviceId: string,
): Promise<Nullable<DocumentSnapshot>> => {
  try {
    const serviceDocument = await getDoc(
      doc(
        firestore,
        FIRESTORE_COLLECTION.BUSINESSES,
        businessId,
        FIRESTORE_COLLECTION.SERVICES,
        serviceId,
      ),
    );
    return serviceDocument.exists() ? serviceDocument : null;
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === FIREBASE_ERROR_CODE.PERMISSION_DENIED
    ) {
      return null;
    }
    throw error;
  }
};

/**
 * The business (by its public slug) and the active service of the booking
 * flow. `null` when the business or the service cannot be booked.
 */
export const fetchBookingContext = async (
  businessSlug: string,
  serviceId: string,
): Promise<Nullable<BookingContext>> => {
  const businessSnapshot = await getDocs(
    query(
      collection(firestore, FIRESTORE_COLLECTION.BUSINESSES),
      where("slug", FIRESTORE_OPERATOR.EQUAL, businessSlug),
      limit(1),
    ),
  );
  const [businessDocument] = businessSnapshot.docs;
  if (!businessDocument) return null;

  const serviceDocument = await readBookableService(
    businessDocument.id,
    serviceId,
  );
  if (!serviceDocument) return null;

  const business = bookingBusinessSchema.parse(businessDocument.data());
  const service = bookingServiceSchema.parse(serviceDocument.data());

  return {
    businessHours: business.businessHours,
    businessId: businessDocument.id,
    currency: business.currency ?? null,
    durationMinutes: service.durationMinutes,
    serviceId,
    serviceName: service.name,
    timeZone: business.timeZone,
  };
};
