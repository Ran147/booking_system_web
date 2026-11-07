import { useParams } from "react-router";
import { VIEW_STATE } from "@/constants";
import { BUSINESS_STATUS } from "@/domain";
import { resolveViewState } from "@/utils";
import { useBusinessPublicProfileBySlugQuery } from "../api/useBusinessPublicProfileBySlugQuery";
import type { CustomerLayoutViewModel } from "../models";

/** Resolves and exposes the business shared by customer portal chrome. */
export const useCustomerLayoutViewModel = (): CustomerLayoutViewModel => {
  const { businessSlug = "" } = useParams<{ businessSlug: string }>();
  const businessQuery = useBusinessPublicProfileBySlugQuery(businessSlug);

  return {
    businessProfile: businessQuery.data ?? null,
    isBusinessUnavailable:
      businessQuery.data?.status === BUSINESS_STATUS.INACTIVE ||
      businessQuery.data?.status === BUSINESS_STATUS.SUSPENDED,
    retry: (): void => {
      void businessQuery.refetch();
    },
    viewState: businessSlug
      ? resolveViewState(businessQuery, businessQuery.data ? 1 : 0)
      : VIEW_STATE.EMPTY,
  };
};
