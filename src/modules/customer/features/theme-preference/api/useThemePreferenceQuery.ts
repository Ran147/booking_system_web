import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ThemeMode } from "@/constants";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError, Nullable } from "@/types";
import { fetchThemePreference } from "./fetchThemePreference";
import { themePreferenceQueryKeys } from "./themePreferenceQueryKeys";

export const useThemePreferenceQuery = (
  userId: string,
): UseQueryResult<Nullable<ThemeMode>, MutationError> =>
  useQuery({
    enabled: userId.length > 0,
    queryFn: async () => {
      try {
        return await fetchThemePreference(userId);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    queryKey: themePreferenceQueryKeys.detail(userId),
  });
