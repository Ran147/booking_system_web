import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { UserLanguagePreference } from "../models";
import { fetchUserLanguage } from "./fetchUserLanguage";
import { userLanguageQueryKeys } from "./userLanguageQueryKeys";

export const useUserLanguageQuery = (
  userId: string,
): UseQueryResult<UserLanguagePreference, Error> =>
  useQuery({
    queryFn: () => fetchUserLanguage(userId),
    queryKey: userLanguageQueryKeys.detail(userId),
  });
