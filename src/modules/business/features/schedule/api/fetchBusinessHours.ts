import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/services/firebase";
import {
  BOOKING_CONFIRMATION_MODE,
  SCHEDULE_CONSTANTS,
  type BookingConfirmationMode,
} from "../constants";
import type { BusinessHours } from "../models";
import { mapBusinessHours } from "./businessHoursDocument.schema";

export interface BusinessHoursResult {
  readonly businessHours: BusinessHours;
  readonly confirmationMode: BookingConfirmationMode;
  readonly timeZone: string;
}

export const fetchBusinessHours = async (
  businessId: string,
): Promise<BusinessHoursResult> => {
  if (!businessId) {
    throw new Error("businessId is required");
  }

  const businessReference = doc(firestore, "businesses", businessId);
  const businessSnapshot = await getDoc(businessReference);

  if (!businessSnapshot.exists()) {
    throw new Error("business:errors.notFound");
  }

  const businessDocData = businessSnapshot.data();
  const businessHours = mapBusinessHours(businessDocData.businessHours);
  const rawTimeZone = (businessDocData.timeZone as string) || "";
  const timeZone = rawTimeZone || SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE;
  const confirmationMode =
    businessDocData.bookingConfirmationMode === BOOKING_CONFIRMATION_MODE.MANUAL
      ? BOOKING_CONFIRMATION_MODE.MANUAL
      : BOOKING_CONFIRMATION_MODE.AUTOMATIC;

  return {
    businessHours,
    confirmationMode,
    timeZone,
  };
};
