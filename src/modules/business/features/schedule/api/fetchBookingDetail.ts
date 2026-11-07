import { doc, getDoc } from "firebase/firestore";
import type { Booking } from "@/domain";
import { firestore } from "@/services/firebase";
import { mapBookingDocument } from "./bookingDocument.schema";

export const fetchBookingDetail = async (
  businessId: string,
  bookingId: string,
): Promise<Booking> => {
  if (!businessId || !bookingId) {
    throw new Error("businessId and bookingId are required");
  }

  const bookingReference = doc(
    firestore,
    "businesses",
    businessId,
    "bookings",
    bookingId,
  );
  const bookingSnapshot = await getDoc(bookingReference);

  if (!bookingSnapshot.exists()) {
    throw new Error("business:schedule.bookings.notFound");
  }

  return mapBookingDocument(bookingSnapshot);
};
