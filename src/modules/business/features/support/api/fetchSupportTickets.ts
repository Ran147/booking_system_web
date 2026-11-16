import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import type { SupportTicket } from "@/domain";
import { firestore } from "@/services/firebase/firebaseApp";
import { mapSupportTicketDocument } from "./SupportTicketDocument.schema";

export const fetchSupportTickets = async (
  businessId: string,
): Promise<SupportTicket[]> => {
  if (!businessId) {
    return [];
  }

  const ticketsCollectionReference = collection(
    firestore,
    FIRESTORE_COLLECTION.SUPPORT_TICKETS,
  );

  const ticketsQuery = query(
    ticketsCollectionReference,
    where("businessId", "==", businessId),
    orderBy("createdAt", "desc"),
  );

  const querySnapshot = await getDocs(ticketsQuery);

  return querySnapshot.docs.map(mapSupportTicketDocument);
};
