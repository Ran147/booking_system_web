import { doc, updateDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  type StorageReference,
} from "firebase/storage";
import { BUSINESS_PROFILE, FIRESTORE_COLLECTION } from "@/constants";
import { firestore, storage, uploadImageToImgbb } from "@/services";
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
    if (import.meta.env.VITE_IMGBB_API_KEY && !import.meta.env.VITEST) {
      logoUrl = await uploadImageToImgbb(logoFile);
    } else {
      const logoReference = getLogoReference(businessId);
      await uploadBytes(logoReference, logoFile, {
        contentType: logoFile.type,
      });
      logoUrl = await getDownloadURL(logoReference);
    }
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
    if (
      import.meta.env.VITEST ||
      !import.meta.env.VITE_IMGBB_API_KEY ||
      values.logoUrl.includes("firebasestorage.googleapis.com")
    ) {
      await deleteObject(getLogoReference(businessId));
    }
  }
};
