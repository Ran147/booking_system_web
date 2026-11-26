import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services";
import type { NullableRef } from "@/types";
import { CustomerPersonalProfileDocumentSchema } from "./CustomerPersonalProfileDocument.schema";
import type { CustomerPersonalProfile } from "../models";

export const fetchCustomerPersonalProfile = async (
  userId: string,
): Promise<NullableRef<CustomerPersonalProfile>> => {
  const documentSnapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.USERS, userId),
  );

  return documentSnapshot.exists()
    ? CustomerPersonalProfileDocumentSchema.parse(documentSnapshot.data())
    : null;
};
