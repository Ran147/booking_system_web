import { doc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION } from "@/constants";
import { DEFAULT_PLATFORM_SETTINGS } from "@/domain/platform-settings/DefaultPlatformSettings.constants";
import { firestore } from "@/services/firebase";

export interface PlatformSettingsData {
  readonly gracePeriodDays: number;
}

const platformSettingsDocumentSchema = z.object({
  gracePeriodDays: z
    .number()
    .optional()
    .default(DEFAULT_PLATFORM_SETTINGS.GRACE_PERIOD_DAYS),
});

export const fetchPlatformSettings =
  async (): Promise<PlatformSettingsData> => {
    const settingsDocumentReference = doc(
      firestore,
      FIRESTORE_COLLECTION.PLATFORM_SETTINGS,
      "current",
    );
    const documentSnapshot = await getDoc(settingsDocumentReference);

    if (!documentSnapshot.exists()) {
      return {
        gracePeriodDays: DEFAULT_PLATFORM_SETTINGS.GRACE_PERIOD_DAYS,
      };
    }

    const documentData = platformSettingsDocumentSchema.parse(
      documentSnapshot.data() ?? {},
    );

    return {
      gracePeriodDays: documentData.gracePeriodDays,
    };
  };
