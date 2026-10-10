import { doc, updateDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  type StorageReference,
} from "firebase/storage";
import { BUSINESS_PROFILE, FIRESTORE_COLLECTION } from "@/constants";
import { firestore, storage } from "@/services";
import type { SaveBusinessPublicProfileInput } from "../models/BusinessProfileForm.model";

const getLogoReference = (businessId: string): StorageReference =>
  ref(
    storage,
    `${FIRESTORE_COLLECTION.BUSINESSES}/${businessId}/${BUSINESS_PROFILE.LOGO_PATH}`,
  );

export const saveBusinessPublicProfile = async ({
  businessId,
  logoFile,
  removeLogo,
  values,
}: SaveBusinessPublicProfileInput): Promise<void> => {
  let logoUrl = values.logoUrl;

  if (logoFile) {
    const logoReference = getLogoReference(businessId);
    await uploadBytes(logoReference, logoFile, { contentType: logoFile.type });
    logoUrl = await getDownloadURL(logoReference);
  } else if (removeLogo) {
    logoUrl = null;
  }

  await updateDoc(doc(firestore, FIRESTORE_COLLECTION.BUSINESSES, businessId), {
    contactEmail: values.contactEmail,
    contactPhone: values.contactPhone,
    description: values.description,
    logoUrl,
    name: values.name,
    socialLinks: values.socialLinks,
  });

  if (removeLogo && values.logoUrl) {
    await deleteObject(getLogoReference(businessId));
  }
};
