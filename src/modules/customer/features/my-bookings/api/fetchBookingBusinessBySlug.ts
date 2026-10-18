import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { FIRESTORE_COLLECTION, FIRESTORE_OPERATOR } from "@/constants";
import { firestore } from "@/services";
import type { Nullable } from "@/shared/types";
import { mapBookingBusiness } from "./businessDocument.schema";
import { BUSINESS_FIELD } from "../constants";
import type { BookingBusiness } from "../models";

// The slug is public (Q4); the booking rules, not this lookup, protect data.
export const fetchBookingBusinessBySlug = async (
  businessSlug: string,
): Promise<Nullable<BookingBusiness>> => {
  const businessSnapshot = await getDocs(
    query(
      collection(firestore, FIRESTORE_COLLECTION.BUSINESSES),
      where(BUSINESS_FIELD.SLUG, FIRESTORE_OPERATOR.EQUAL, businessSlug),
      limit(1),
    ),
  );
  const [businessDocument] = businessSnapshot.docs;

  return businessDocument ? mapBookingBusiness(businessDocument) : null;
};
