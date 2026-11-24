import { useParams } from "react-router";
import { VIEW_STATE } from "@/constants";
import { resolveViewState } from "@/utils";
import { useBusinessPublicProfileBySlugQuery } from "../api/useBusinessPublicProfileBySlugQuery";
import type { CustomerLayoutViewModel } from "../models";

/** Resolves and exposes the business shared by customer portal chrome. */
export const useCustomerLayoutViewModel = (): CustomerLayoutViewModel => {
  const { businessSlug = "" } = useParams<{ businessSlug: string }>();
  const businessQuery = useBusinessPublicProfileBySlugQuery(businessSlug);

  return {
    businessProfile: businessQuery.data ?? null,
    retry: (): void => {
      void businessQuery.refetch();
    },
    viewState: businessSlug
      ? resolveViewState(businessQuery, businessQuery.data ? 1 : 0)
      : VIEW_STATE.EMPTY,
  };
};
