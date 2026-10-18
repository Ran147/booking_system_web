import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchPlatformSettings } from "./fetchPlatformSettings";
import { platformSettingsQueryKeys } from "./platformSettingsQueryKeys";
import type { PlatformSettings } from "../models/PlatformSettings.schema";

// No retries: when the settings cannot be read the default is used. The value
// is read when the session starts, so a change made by the admin applies from
// the next session or page load (AS-6, AC-KAN-38-07); there is no refetch on
// window focus.
export const usePlatformSettingsQuery = (): UseQueryResult<
  PlatformSettings,
  Error
> =>
  useQuery({
    queryFn: fetchPlatformSettings,
    queryKey: platformSettingsQueryKeys.current(),
    retry: false,
  });
