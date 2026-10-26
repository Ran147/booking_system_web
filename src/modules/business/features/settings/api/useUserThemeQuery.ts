import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { UserThemePreference } from "../models";
import { fetchUserTheme } from "./fetchUserTheme";
import { userThemeQueryKeys } from "./userThemeQueryKeys";

export const useUserThemeQuery = (
  userId: string,
): UseQueryResult<UserThemePreference, Error> =>
  useQuery({
    enabled: Boolean(userId),
    queryFn: () => fetchUserTheme(userId),
    queryKey: userThemeQueryKeys.detail(userId),
  });
