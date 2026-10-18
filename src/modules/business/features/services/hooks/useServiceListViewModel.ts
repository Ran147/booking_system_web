import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "@/components/common";
import {
  FIREBASE_ERROR_CODE,
  FIRESTORE_COLLECTION,
  I18N_NAMESPACE,
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
import type { Nullable } from "@/types";
import {
  fetchBusinessInfo,
  useDeleteServiceMutation,
  useServiceListQuery,
  useUpdateServiceStatusMutation,
  type BusinessInfo,
} from "../api";
import { DEFAULT_SERVICE_LIST_CURRENCY } from "../constants/ServiceList.constants";
import type {
  ServiceListFilters,
  ServiceListItem,
  ServiceListViewModel,
  UseServiceListViewModelOptions,
} from "../models";

export const useServiceListViewModel = (
  options: UseServiceListViewModelOptions = {},
): ServiceListViewModel => {
  const navigate = useNavigate();
  const [searchParameters, setSearchParameters] = useSearchParams();
  const { businessId } = useCurrentBusiness();
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);

  const [deactivatingService, setDeactivatingService] =
    useState<Nullable<ServiceListItem>>(null);
  const [deletingService, setDeletingService] =
    useState<Nullable<ServiceListItem>>(null);

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

  const updateServiceStatusMutation = useUpdateServiceStatusMutation();
  const deleteServiceMutation = useDeleteServiceMutation();

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

  const handleActivateService = (serviceId: string): void => {
    if (isReadOnly) {
      toast.error(t("business:errors.readOnly"));
      return;
    }

    updateServiceStatusMutation.mutate(
      {
        businessId,
        serviceId,
        status: SERVICE_STATUS.ACTIVE,
      },
      {
        onError: (mutationError) => {
          toast.error(t(`common:${mutationError.messageKey}`));
        },
        onSuccess: () => {
          toast.success(t("business:services.status.activateSuccess"));
        },
      },
    );
  };

  const handleOpenDeactivateModal = (serviceId: string): void => {
    if (isReadOnly) {
      toast.error(t("business:errors.readOnly"));
      return;
    }

    const targetService = (serviceListQuery.data?.items ?? []).find(
      (serviceItem) => serviceItem.id === serviceId,
    );
    if (targetService) {
      setDeactivatingService(targetService);
    }
  };

  const handleCloseDeactivateModal = (): void => {
    setDeactivatingService(null);
  };

  const handleConfirmDeactivate = (): void => {
    if (!deactivatingService) {
      return;
    }

    if (isReadOnly) {
      toast.error(t("business:errors.readOnly"));
      setDeactivatingService(null);
      return;
    }

    const targetServiceId = deactivatingService.id;
    setDeactivatingService(null);

    updateServiceStatusMutation.mutate(
      {
        businessId,
        serviceId: targetServiceId,
        status: SERVICE_STATUS.INACTIVE,
      },
      {
        onError: (mutationError) => {
          toast.error(t(`common:${mutationError.messageKey}`));
        },
        onSuccess: () => {
          toast.success(t("business:services.status.deactivateSuccess"));
        },
      },
    );
  };

  const handleOpenDeleteModal = (serviceId: string): void => {
    if (isReadOnly) {
      toast.error(t("business:errors.readOnly"));
      return;
    }

    const targetService = (serviceListQuery.data?.items ?? []).find(
      (serviceItem) => serviceItem.id === serviceId,
    );
    if (!targetService) {
      return;
    }

    if (targetService.status === SERVICE_STATUS.ACTIVE) {
      toast.error(t("business:services.delete.mustBeInactiveError"));
      return;
    }

    setDeletingService(targetService);
  };

  const handleCloseDeleteModal = (): void => {
    setDeletingService(null);
  };

  const handleConfirmDelete = (): void => {
    if (!deletingService) {
      return;
    }

    if (isReadOnly) {
      toast.error(t("business:errors.readOnly"));
      setDeletingService(null);
      return;
    }

    const targetServiceId = deletingService.id;
    setDeletingService(null);

    deleteServiceMutation.mutate(
      {
        businessId,
        serviceId: targetServiceId,
      },
      {
        onError: (mutationError) => {
          if (mutationError.code === FIREBASE_ERROR_CODE.FAILED_PRECONDITION) {
            toast.error(t("business:services.delete.hasBookingsError"));
          } else {
            toast.error(t(`common:${mutationError.messageKey}`));
          }
        },
        onSuccess: () => {
          toast.success(t("business:services.delete.success"));
        },
      },
    );
  };

  const handleSearchChange = (newSearchTerm: string): void => {
    const nextParameters = new URLSearchParams(searchParameters);
    if (newSearchTerm.trim().length > 0) {
      nextParameters.set(SEARCH_PARAM.SEARCH, newSearchTerm);
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
    deactivatingService,
    deletingService,
    filters,
    handleActivateService,
    handleClearFilters,
    handleCloseDeactivateModal,
    handleCloseDeleteModal,
    handleConfirmDeactivate,
    handleConfirmDelete,
    handleCreateService,
    handleEditService,
    handleNextPage,
    handleOpenDeactivateModal,
    handleOpenDeleteModal,
    handlePreviousPage,
    handleRetry,
    handleSearchChange,
    handleStatusChange,
    hasActiveFilters,
    hasNextPage: Boolean(serviceListQuery.data?.nextCursor),
    hasPreviousPage: pagination.hasPreviousPage,
    isDeactivating: updateServiceStatusMutation.isPending,
    isDeleting: deleteServiceMutation.isPending,
    isEmpty,
    isNoResults,
    isReadOnly,
    pageNumber: pagination.pageNumber,
    services,
    totalCount,
    viewState,
  };
};
