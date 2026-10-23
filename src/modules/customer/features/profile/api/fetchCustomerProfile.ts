import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import type { Nullable } from "@/types";
import { mapCustomerProfile } from "./CustomerProfileDocument.schema";
import type { CustomerProfile } from "../models";

export const fetchCustomerProfile = async (
  userId: string,
): Promise<Nullable<CustomerProfile>> => {
  const profileDocument = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.USERS, userId),
  );

  return profileDocument.exists() ? mapCustomerProfile(profileDocument) : null;
};
