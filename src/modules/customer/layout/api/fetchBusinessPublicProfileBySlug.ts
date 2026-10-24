import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { FIRESTORE_COLLECTION, FIRESTORE_OPERATOR } from "@/constants";
import {
  BUSINESS_STATUS,
  BusinessPublicProfileDocumentSchema,
  SocialLinkDocumentSchema,
  type BusinessPublicProfile,
} from "@/domain";
import { firestore } from "@/services";
import type { NullableRef } from "@/types";
import {
  CUSTOMER_BUSINESS_FIELD,
  CUSTOMER_BUSINESS_QUERY,
} from "../constants/CustomerBusiness.constants";

const withSafeSocialLinks = (documentData: unknown): unknown => {
  if (
    typeof documentData !== "object" ||
    documentData === null ||
    Array.isArray(documentData)
  ) {
    return documentData;
  }

  const businessData = documentData as Record<string, unknown>;
  if (!Array.isArray(businessData.socialLinks)) return documentData;

  const socialLinks = businessData.socialLinks.flatMap((socialLink) => {
    const parseResult = SocialLinkDocumentSchema.safeParse(socialLink);
    return parseResult.success ? [parseResult.data] : [];
  });

  return { ...businessData, socialLinks };
};

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
    withSafeSocialLinks(documentSnapshot.data()),
  );

  if (
    profile.status === BUSINESS_STATUS.PENDING ||
    profile.status === BUSINESS_STATUS.REJECTED
  ) {
    return null;
  }

  return { id: documentSnapshot.id, ...profile };
};
