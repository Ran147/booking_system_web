import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services";
import type { Nullable } from "@/shared/types";
import { mapMyBooking } from "./bookingDocument.schema";
import type { MyBooking } from "../models";

// Resolves to null when the booking does not exist. A booking of another
// customer is rejected by the rules (permission-denied).
export const fetchMyBooking = async (
  businessId: string,
  bookingId: string,
): Promise<Nullable<MyBooking>> => {
  const bookingDocument = await getDoc(
    doc(
      firestore,
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.BOOKINGS,
      bookingId,
    ),
  );

  return bookingDocument.exists() ? mapMyBooking(bookingDocument) : null;
};
