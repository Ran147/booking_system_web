import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchUserLanguage } from "./fetchUserLanguage";
import { userLanguageQueryKeys } from "./userLanguageQueryKeys";
import type { UserLanguagePreference } from "../models/UserLanguagePreference.model";

export const useUserLanguageQuery = (
  userId: string,
): UseQueryResult<UserLanguagePreference, Error> =>
  useQuery({
    enabled: Boolean(userId),
    queryFn: () => fetchUserLanguage(userId),
    queryKey: userLanguageQueryKeys.detail(userId),
  });
