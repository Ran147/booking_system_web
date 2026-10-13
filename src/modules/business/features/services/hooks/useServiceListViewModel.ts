import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { FIRESTORE_COLLECTION, ROUTE_PATH } from "@/constants";
import { BUSINESS_STATUS, type BusinessStatus } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import { fetchBusinessStatus } from "../api";
import type {
  ServiceListViewModel,
  UseServiceListViewModelOptions,
} from "../models";

export const useServiceListViewModel = (
  options: UseServiceListViewModelOptions = {},
): ServiceListViewModel => {
  const navigate = useNavigate();
  const { businessId } = useCurrentBusiness();

  const businessStatusQuery = useQuery<BusinessStatus>({
    enabled: options.businessStatus === undefined,
    queryFn: () => fetchBusinessStatus(businessId),
    queryKey: [FIRESTORE_COLLECTION.BUSINESSES, businessId, "status"],
  });

  const effectiveBusinessStatus =
    options.businessStatus ??
    businessStatusQuery.data ??
    BUSINESS_STATUS.ACTIVE;

  const isReadOnly = effectiveBusinessStatus !== BUSINESS_STATUS.ACTIVE;

  const handleCreateService = (): void => {
    if (options.onCreateService) {
      options.onCreateService();
    } else {
      navigate(`/business/${ROUTE_PATH.BUSINESS.SERVICE_NEW}`);
    }
  };

  return {
    handleCreateService,
    isEmpty: true,
    isLoading:
      businessStatusQuery.isLoading && options.businessStatus === undefined,
    isReadOnly,
    services: [],
  };
};
