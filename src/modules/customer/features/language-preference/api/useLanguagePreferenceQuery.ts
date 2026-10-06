import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Language } from "@/constants";
import type { Nullable } from "@/types";
import { fetchLanguagePreference } from "./fetchLanguagePreference";
import { languagePreferenceQueryKeys } from "./languagePreferenceQueryKeys";

export const useLanguagePreferenceQuery = (
  userId: string,
): UseQueryResult<Nullable<Language>, Error> =>
  useQuery({
    enabled: userId.length > 0,
    queryFn: () => fetchLanguagePreference(userId),
    queryKey: languagePreferenceQueryKeys.detail(userId),
  });
