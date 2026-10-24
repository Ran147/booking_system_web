import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { BusinessPublicProfile } from "@/domain";
import type { NullableRef } from "@/types";
import { customerBusinessQueryKeys } from "./customerBusinessQueryKeys";
import { fetchBusinessPublicProfileBySlug } from "./fetchBusinessPublicProfileBySlug";

export const useBusinessPublicProfileBySlugQuery = (
  businessSlug: string,
): UseQueryResult<NullableRef<BusinessPublicProfile>, Error> =>
  useQuery({
    enabled: businessSlug.length > 0,
    queryFn: () => fetchBusinessPublicProfileBySlug(businessSlug),
    queryKey: customerBusinessQueryKeys.bySlug(businessSlug),
  });
