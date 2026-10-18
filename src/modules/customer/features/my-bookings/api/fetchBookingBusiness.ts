import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services";
import { mapBookingBusiness } from "./businessDocument.schema";
import type { BookingBusiness } from "../models";

export const fetchBookingBusiness = async (
  businessId: string,
): Promise<BookingBusiness> => {
  const businessDocument = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.BUSINESSES, businessId),
  );

  return mapBookingBusiness(businessDocument);
};
