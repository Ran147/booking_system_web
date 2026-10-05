import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import type { Nullable } from "@/types";
import type { CustomerProfile } from "../models";
import { customerProfileDocumentSchema } from "./CustomerProfileDocument.schema";

export const fetchCustomerProfile = async (
  userId: string,
): Promise<Nullable<CustomerProfile>> => {
  const snapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.USERS, userId),
  );

  if (!snapshot.exists()) return null;

  return customerProfileDocumentSchema.parse(snapshot.data());
};
