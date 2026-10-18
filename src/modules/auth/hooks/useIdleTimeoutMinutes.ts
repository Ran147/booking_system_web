import { DEFAULT_PLATFORM_SETTINGS } from "@/domain";
import { usePlatformSettingsQuery } from "../api/usePlatformSettingsQuery";

// AC-KAN-38-04 / AC-KAN-133-02: a failed or missing read never blocks the
// user; the default applies.
export const useIdleTimeoutMinutes = (): number => {
  const platformSettingsQuery = usePlatformSettingsQuery();

  return (
    platformSettingsQuery.data?.idleTimeoutMinutes ??
    DEFAULT_PLATFORM_SETTINGS.IDLE_TIMEOUT_MINUTES
  );
};
