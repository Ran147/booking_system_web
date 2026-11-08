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

  const booking = mapBookingDocument(bookingSnapshot);

  if (booking.cancellation) {
    try {
      const internalNoteSnapshot = await getDoc(
        doc(
          firestore,
          "businesses",
          businessId,
          "bookings",
          bookingId,
          "internalNotes",
          "cancellation",
        ),
      );
      if (internalNoteSnapshot.exists()) {
        const noteData = internalNoteSnapshot.data();
        booking.cancellation = {
          ...booking.cancellation,
          note: (noteData?.note as string) || booking.cancellation.note,
        };
      }
    } catch {
      // Internal note not present or unreadable
    }
  }

  return booking;
};
