import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION, FIRESTORE_OPERATOR } from "@/constants";
import { SERVICE_STATUS } from "@/domain";
import { firestore } from "@/services";
import type { BookableCatalog } from "../models/serviceSelection.model";

const DEFAULT_CURRENCY = "CRC";

const catalogBusinessSchema = z.object({ currency: z.string().nullish() });

const bookableServiceSchema = z.object({
  durationMinutes: z.number().positive(),
  name: z.string().min(1),
  priceInCents: z.number().int().nonnegative(),
});

/**
 * The active services of the business with that slug (AC-KAN-135-01). The
 * rules let anyone read an active service; a service that fails the schema is
 * left out instead of breaking the list.
 */
export const fetchBookableCatalog = async (
  businessSlug: string,
): Promise<BookableCatalog> => {
  const businessSnapshot = await getDocs(
    query(
      collection(firestore, FIRESTORE_COLLECTION.BUSINESSES),
      where("slug", FIRESTORE_OPERATOR.EQUAL, businessSlug),
      limit(1),
    ),
  );
  const [businessDocument] = businessSnapshot.docs;
  if (!businessDocument) return { currency: DEFAULT_CURRENCY, services: [] };

  const servicesSnapshot = await getDocs(
    query(
      collection(
        firestore,
        FIRESTORE_COLLECTION.BUSINESSES,
        businessDocument.id,
        FIRESTORE_COLLECTION.SERVICES,
      ),
      where("status", FIRESTORE_OPERATOR.EQUAL, SERVICE_STATUS.ACTIVE),
    ),
  );

  const business = catalogBusinessSchema.parse(businessDocument.data());
  return {
    currency: business.currency ?? DEFAULT_CURRENCY,
    services: servicesSnapshot.docs.flatMap((serviceDocument) => {
      const parsed = bookableServiceSchema.safeParse(serviceDocument.data());
      return parsed.success ? [{ id: serviceDocument.id, ...parsed.data }] : [];
    }),
  };
};
