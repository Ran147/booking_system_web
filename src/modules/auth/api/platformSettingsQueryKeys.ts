import { FIRESTORE_COLLECTION } from "@/constants";

export const platformSettingsQueryKeys = {
  current: (): readonly [string] => [FIRESTORE_COLLECTION.PLATFORM_SETTINGS],
} as const;
