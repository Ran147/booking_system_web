import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import {
  FIRESTORE_COLLECTION,
  PAGINATION,
  ROUTE_PATH,
  SEARCH_PARAM,
  STRING,
  VIEW_STATE,
  type ViewState,
} from "@/constants";
import { BUSINESS_STATUS, SERVICE_STATUS, type ServiceStatus } from "@/domain";
import { useCursorPagination } from "@/hooks";
import { useCurrentBusiness } from "@/modules/auth";
import {
  fetchBusinessInfo,
  useServiceListQuery,
  type BusinessInfo,
} from "../api";
import { DEFAULT_SERVICE_LIST_CURRENCY } from "../constants/ServiceList.constants";
import type {
  ServiceListFilters,
  ServiceListViewModel,
  UseServiceListViewModelOptions,
} from "../models";

export const useServiceListViewModel = (
  options: UseServiceListViewModelOptions = {},
): ServiceListViewModel => {
  const navigate = useNavigate();
  const [searchParameters, setSearchParameters] = useSearchParams();
  const { businessId } = useCurrentBusiness();

  const rawSearchTerm =
    searchParameters.get(SEARCH_PARAM.SEARCH) ?? STRING.EMPTY;
  const rawStatus = searchParameters.get(SEARCH_PARAM.STATUS) ?? STRING.EMPTY;

  const validStatus: ServiceStatus | "" =
    rawStatus === SERVICE_STATUS.ACTIVE || rawStatus === SERVICE_STATUS.INACTIVE
      ? rawStatus
      : "";

  const filters: ServiceListFilters = {
    searchTerm: rawSearchTerm,
    status: validStatus,
  };

  const businessInfoQuery = useQuery<BusinessInfo>({
    enabled:
      options.businessStatus === undefined || options.currency === undefined,
    queryFn: () => fetchBusinessInfo(businessId),
    queryKey: [FIRESTORE_COLLECTION.BUSINESSES, businessId, "info"],
  });

  const effectiveBusinessStatus =
    options.businessStatus ??
    businessInfoQuery.data?.status ??
    BUSINESS_STATUS.ACTIVE;

  const effectiveCurrency =
    options.currency ??
    businessInfoQuery.data?.currency ??
    DEFAULT_SERVICE_LIST_CURRENCY;

  const isReadOnly = effectiveBusinessStatus !== BUSINESS_STATUS.ACTIVE;

  const pagination = useCursorPagination([filters.searchTerm, filters.status]);

  const serviceListQuery = useServiceListQuery({
    businessId,
    filters,
    pageCursor: pagination.currentCursor,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  });

  const handleCreateService = (): void => {
    if (options.onCreateService) {
      options.onCreateService();
    } else {
      navigate(`/business/${ROUTE_PATH.BUSINESS.SERVICE_NEW}`);
    }
  };

  const handleEditService = (serviceId: string): void => {
    if (options.onEditService) {
      options.onEditService(serviceId);
    } else {
      navigate(`/business/${ROUTE_PATH.BUSINESS.SERVICES}/${serviceId}/edit`);
    }
  };

  const handleSearchChange = (newSearchTerm: string): void => {
    const nextParameters = new URLSearchParams(searchParameters);
    const trimmedTerm = newSearchTerm.trim();
    if (trimmedTerm.length > 0) {
      nextParameters.set(SEARCH_PARAM.SEARCH, trimmedTerm);
    } else {
      nextParameters.delete(SEARCH_PARAM.SEARCH);
    }
    setSearchParameters(nextParameters);
  };

  const handleStatusChange = (newStatus: string): void => {
    const nextParameters = new URLSearchParams(searchParameters);
    if (
      newStatus === SERVICE_STATUS.ACTIVE ||
      newStatus === SERVICE_STATUS.INACTIVE
    ) {
      nextParameters.set(SEARCH_PARAM.STATUS, newStatus);
    } else {
      nextParameters.delete(SEARCH_PARAM.STATUS);
    }
    setSearchParameters(nextParameters);
  };

  const handleClearFilters = (): void => {
    const nextParameters = new URLSearchParams(searchParameters);
    nextParameters.delete(SEARCH_PARAM.SEARCH);
    nextParameters.delete(SEARCH_PARAM.STATUS);
    setSearchParameters(nextParameters);
  };

  const handleNextPage = (): void => {
    if (serviceListQuery.data?.nextCursor) {
      pagination.goToNextPage(serviceListQuery.data.nextCursor);
    }
  };

  const handlePreviousPage = (): void => {
    pagination.goToPreviousPage();
  };

  const handleRetry = (): void => {
    serviceListQuery.refetch();
  };

  const hasActiveFilters = Boolean(filters.searchTerm || filters.status);
  const totalCount = serviceListQuery.data?.totalCount ?? 0;
  const services = serviceListQuery.data?.items ?? [];

  let viewState: ViewState = VIEW_STATE.READY;
  if (serviceListQuery.isPending && !serviceListQuery.data) {
    viewState = VIEW_STATE.LOADING;
  } else if (serviceListQuery.isError) {
    viewState = VIEW_STATE.ERROR;
  } else if (totalCount === 0 && !hasActiveFilters) {
    viewState = VIEW_STATE.EMPTY;
  }

  const isEmpty =
    totalCount === 0 && !hasActiveFilters && viewState === VIEW_STATE.EMPTY;
  const isNoResults =
    totalCount === 0 && hasActiveFilters && viewState === VIEW_STATE.READY;

  return {
    currency: effectiveCurrency,
    filters,
    handleClearFilters,
    handleCreateService,
    handleEditService,
    handleNextPage,
    handlePreviousPage,
    handleRetry,
    handleSearchChange,
    handleStatusChange,
    hasActiveFilters,
    hasNextPage: Boolean(serviceListQuery.data?.nextCursor),
    hasPreviousPage: pagination.hasPreviousPage,
    isEmpty,
    isNoResults,
    isReadOnly,
    pageNumber: pagination.pageNumber,
    services,
    totalCount,
    viewState,
  };
};
