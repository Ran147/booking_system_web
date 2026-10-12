import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { FIRESTORE_COLLECTION, FIRESTORE_OPERATOR } from "@/constants";
import {
  BusinessPublicProfileDocumentSchema,
  type BusinessPublicProfile,
} from "@/domain";
import { firestore } from "@/services";
import type { NullableRef } from "@/types";
import {
  CUSTOMER_BUSINESS_FIELD,
  CUSTOMER_BUSINESS_QUERY,
} from "../constants/CustomerBusiness.constants";

export const fetchBusinessPublicProfileBySlug = async (
  businessSlug: string,
): Promise<NullableRef<BusinessPublicProfile>> => {
  const businessQuery = query(
    collection(firestore, FIRESTORE_COLLECTION.BUSINESSES),
    where(CUSTOMER_BUSINESS_FIELD.SLUG, FIRESTORE_OPERATOR.EQUAL, businessSlug),
    limit(CUSTOMER_BUSINESS_QUERY.RESULT_LIMIT),
  );
  const querySnapshot = await getDocs(businessQuery);
  const documentSnapshot = querySnapshot.docs.at(0);

  if (!documentSnapshot) return null;

  const profile = BusinessPublicProfileDocumentSchema.parse(
    documentSnapshot.data(),
  );

  return { id: documentSnapshot.id, ...profile };
};
