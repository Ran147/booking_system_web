import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { BusinessPublicProfile } from "@/domain";
import { businessProfileQueryKeys } from "./businessProfileQueryKeys";
import { fetchBusinessPublicProfile } from "./fetchBusinessPublicProfile";

export const useBusinessPublicProfileQuery = (
  businessId: string,
): UseQueryResult<BusinessPublicProfile, Error> =>
  useQuery({
    queryFn: () => fetchBusinessPublicProfile(businessId),
    queryKey: businessProfileQueryKeys.detail(businessId),
  });
