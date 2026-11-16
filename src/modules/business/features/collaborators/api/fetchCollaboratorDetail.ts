import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION, FIRESTORE_OPERATOR } from "@/constants";
import { COLLABORATOR_PERMISSION, type CollaboratorPermission } from "@/domain";
import { firestore } from "@/services/firebase";
import type { Nullable } from "@/types";
import {
  collaboratorDocumentSchema,
  parseIsoTimestamp,
} from "./CollaboratorDocument.schema";
import {
  COLLABORATOR_BOOKING_ACTIVE_STATUSES,
  COLLABORATOR_FIELD,
} from "../constants/CollaboratorFeature.constants";
import type { ActiveServiceOption, CollaboratorDetailData } from "../models";

const serviceNameSchema = z.object({
  name: z.string().optional().default(""),
});

const bookingPreviewSchema = z.object({
  serviceId: z.string().optional().default(""),
  startsAt: z.unknown().optional(),
});

const permissionSet = new Set<string>(Object.values(COLLABORATOR_PERMISSION));

const normalizePermissions = (
  rawPermissions: unknown,
): readonly CollaboratorPermission[] => {
  if (!Array.isArray(rawPermissions)) {
    return [];
  }
  return rawPermissions.filter(
    (item): item is CollaboratorPermission =>
      typeof item === "string" && permissionSet.has(item),
  );
};

export const fetchCollaboratorDetail = async (
  businessId: string,
  collaboratorId: string,
): Promise<Nullable<CollaboratorDetailData>> => {
  const collaboratorDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.COLLABORATORS,
    collaboratorId,
  );
  const documentSnapshot = await getDoc(collaboratorDocumentReference);
  if (!documentSnapshot.exists()) {
    return null;
  }

  const parsed = collaboratorDocumentSchema.parse(
    documentSnapshot.data() ?? {},
  );
  if (parsed.is_owner) {
    return null;
  }

  const resolvedServices: ActiveServiceOption[] = await Promise.all(
    parsed.serviceIds.map(async (serviceId) => {
      const serviceDocumentReference = doc(
        firestore,
        FIRESTORE_COLLECTION.BUSINESSES,
        businessId,
        FIRESTORE_COLLECTION.SERVICES,
        serviceId,
      );
      const serviceSnapshot = await getDoc(serviceDocumentReference);
      const serviceName = serviceSnapshot.exists()
        ? serviceNameSchema.parse(serviceSnapshot.data() ?? {}).name
        : serviceId;
      return {
        id: serviceId,
        name: serviceName || serviceId,
      };
    }),
  );

  const upcomingBookingsQuery = query(
    collection(
      firestore,
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.BOOKINGS,
    ),
    where(
      COLLABORATOR_FIELD.COLLABORATOR_ID,
      FIRESTORE_OPERATOR.EQUAL,
      collaboratorId,
    ),
    where(
      COLLABORATOR_FIELD.STATUS,
      FIRESTORE_OPERATOR.IN,
      COLLABORATOR_BOOKING_ACTIVE_STATUSES,
    ),
  );

  let hasUpcomingBookingsError = false;
  let upcomingBookingsCount = 0;
  const upcomingServicesWithBookings = new Set<string>();
  const upcomingBookingsByService: Record<string, number> = {};
  try {
    const bookingsSnapshot = await getDocs(upcomingBookingsQuery);
    const nowMillis = Date.now();
    for (const bookingDocument of bookingsSnapshot.docs) {
      const booking = bookingPreviewSchema.parse(bookingDocument.data() ?? {});
      const startsAtIso = parseIsoTimestamp(booking.startsAt);
      if (startsAtIso && Date.parse(startsAtIso) > nowMillis) {
        upcomingBookingsCount += 1;
        if (booking.serviceId) {
          upcomingServicesWithBookings.add(booking.serviceId);
          upcomingBookingsByService[booking.serviceId] =
            (upcomingBookingsByService[booking.serviceId] ?? 0) + 1;
        }
      }
    }
  } catch {
    hasUpcomingBookingsError = true;
  }

  return {
    businessId,
    email: parsed.email,
    fullName: parsed.fullName,
    hasUpcomingBookingsError,
    id: documentSnapshot.id,
    lastEmailSentAt: parseIsoTimestamp(parsed.lastEmailSentAt),
    permissions: normalizePermissions(parsed.permissions),
    phone: parsed.phone,
    serviceIds: parsed.serviceIds,
    services: resolvedServices,
    specialty: parsed.specialty ?? null,
    status: parsed.status,
    upcomingBookingsByService,
    upcomingBookingsCount,
    upcomingServiceIdsWithBookings: Array.from(upcomingServicesWithBookings),
    updatedAt: parseIsoTimestamp(parsed.updatedAt) ?? "",
    userId: parsed.userId ?? null,
  };
};
