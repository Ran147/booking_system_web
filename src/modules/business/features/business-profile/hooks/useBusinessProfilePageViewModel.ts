import { useCurrentBusiness } from "@/modules/auth";
import { resolveViewState } from "@/utils";
import { useBusinessPublicProfileQuery } from "../api/useBusinessPublicProfileQuery";
import type { BusinessProfilePageViewModel } from "../models";

export const useBusinessProfilePageViewModel =
  (): BusinessProfilePageViewModel => {
    const { businessId } = useCurrentBusiness();
    const profileQuery = useBusinessPublicProfileQuery(businessId);

    return {
      profile: profileQuery.data ?? null,
      retry: (): void => {
        void profileQuery.refetch();
      },
      viewState: resolveViewState(profileQuery, profileQuery.data ? 1 : 0),
    };
  };
