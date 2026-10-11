import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import { parseBookingReminderPreference } from "../models/ReservationReminderPreference.model";

export const fetchBookingReminderPreference = async (
  userId: string,
): Promise<boolean> => {
  const snapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.USERS, userId),
  );
  return snapshot.exists()
    ? parseBookingReminderPreference(snapshot.data())
    : true;
};
