import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { BOOKING_STATUS, COLLABORATOR_STATUS } from "@/domain";
import { firestore } from "@/services/firebase";
import {
  COLLABORATOR_SELECTION_MODE,
  type CollaboratorSelectionMode,
} from "../constants/ServiceCollaborators.constants";
import type {
  ServiceCollaboratorItem,
  ServiceCollaboratorsData,
} from "../models/ServiceCollaborators.interface";

export const fetchServiceCollaboratorsData = async (
  businessId: string,
  serviceId: string,
): Promise<ServiceCollaboratorsData> => {
  const serviceReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.SERVICES,
    serviceId,
  );
  const serviceSnapshot = await getDoc(serviceReference);
  if (!serviceSnapshot.exists()) {
    throw new Error("Service not found");
  }

  const serviceData = serviceSnapshot.data() ?? {};
  const serviceName = String(serviceData.name ?? "");
  const currentSelectionMode: CollaboratorSelectionMode =
    serviceData.collaboratorSelection === COLLABORATOR_SELECTION_MODE.AUTOMATIC
      ? COLLABORATOR_SELECTION_MODE.AUTOMATIC
      : COLLABORATOR_SELECTION_MODE.CUSTOMER_CHOICE;

  const collaboratorsQuery = query(
    collection(
      firestore,
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.COLLABORATORS,
    ),
    where("status", "in", [
      COLLABORATOR_STATUS.ACTIVE,
      COLLABORATOR_STATUS.INVITED,
    ]),
  );
  const collaboratorsSnapshot = await getDocs(collaboratorsQuery);

  const bookingsQuery = query(
    collection(
      firestore,
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.BOOKINGS,
    ),
    where("serviceId", "==", serviceId),
    where("status", "in", [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED]),
  );

  const bookingsSnapshot = await getDocs(bookingsQuery);

  const bookingsCountByCollaborator: Record<string, number> = {};
  bookingsSnapshot.forEach((documentSnapshot) => {
    const bookingDocData = documentSnapshot.data();
    const collaboratorId = bookingDocData.collaboratorId;
    if (typeof collaboratorId === "string") {
      bookingsCountByCollaborator[collaboratorId] =
        (bookingsCountByCollaborator[collaboratorId] ?? 0) + 1;
    }
  });

  const collaborators: ServiceCollaboratorItem[] = [];
  collaboratorsSnapshot.forEach((documentSnapshot) => {
    const collaboratorDocData = documentSnapshot.data();
    const serviceIds: string[] = Array.isArray(collaboratorDocData.serviceIds)
      ? collaboratorDocData.serviceIds
      : [];
    const isAssigned = serviceIds.includes(serviceId);

    collaborators.push({
      email: String(collaboratorDocData.email ?? ""),
      fullName: String(collaboratorDocData.fullName ?? ""),
      id: documentSnapshot.id,
      isAssigned,
      pendingOrConfirmedBookingsCount:
        bookingsCountByCollaborator[documentSnapshot.id] ?? 0,
      status:
        collaboratorDocData.status === COLLABORATOR_STATUS.INVITED
          ? COLLABORATOR_STATUS.INVITED
          : COLLABORATOR_STATUS.ACTIVE,
    });
  });

  return {
    collaborators,
    currentSelectionMode,
    serviceName,
  };
};
