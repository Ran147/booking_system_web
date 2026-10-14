import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchPlatformSettings } from "./fetchPlatformSettings";
import { platformSettingsQueryKeys } from "./platformSettingsQueryKeys";
import type { PlatformSettings } from "../models/PlatformSettings.schema";

// No retries: when the settings cannot be read the default is used, and a
// refetch on window focus picks up a change made by the admin (AS-6).
export const usePlatformSettingsQuery = (): UseQueryResult<
  PlatformSettings,
  Error
> =>
  useQuery({
    queryFn: fetchPlatformSettings,
    queryKey: platformSettingsQueryKeys.current(),
    retry: false,
  });
