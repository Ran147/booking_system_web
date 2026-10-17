import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import {
  platformSettingsSchema,
  type PlatformSettings,
} from "../models/PlatformSettings.schema";

const PLATFORM_SETTINGS_DOCUMENT_ID = "current";

// Rejects when the document is missing, unreadable or invalid; the caller
// decides on the fallback (AC-KAN-38-04).
export const fetchPlatformSettings = async (): Promise<PlatformSettings> => {
  const documentSnapshot = await getDoc(
    doc(
      firestore,
      FIRESTORE_COLLECTION.PLATFORM_SETTINGS,
      PLATFORM_SETTINGS_DOCUMENT_ID,
    ),
  );

  return platformSettingsSchema.parse(documentSnapshot.data());
};
