import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH, SEARCH_PARAM, STRING } from "@/constants";
import { COLLABORATOR_STATUS, type CollaboratorStatus } from "@/domain";
import { useCursorPagination } from "@/hooks";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { resolveViewState } from "@/utils";
import {
  buildCollaboratorInvitationUrl,
  fetchCollaboratorDetail,
  useActiveServicesForCollaboratorQuery,
  useCollaboratorListQuery,
  useCollaboratorUsageQuery,
  useResendCollaboratorEmailMutation,
  useUpdateCollaboratorStatusMutation,
  type CollaboratorMutationError,
} from "../api";
import {
  COLLABORATOR_ALL_STATUS_FILTER,
  COLLABORATOR_EMAIL_KIND,
  COLLABORATOR_ERROR_REASON,
  COLLABORATOR_STATUS_DIALOG_MODE,
} from "../constants/CollaboratorFeature.constants";
import type {
  CollaboratorInvitationLinkDialogState,
  CollaboratorLimitDialogState,
  CollaboratorListFilters,
  CollaboratorListItem,
  CollaboratorListViewModel,
  CollaboratorStatusDialogState,
} from "../models";

const parseStatusFilter = (rawValue: string): CollaboratorStatus | "" => {
  if (
    rawValue === COLLABORATOR_STATUS.ACTIVE ||
    rawValue === COLLABORATOR_STATUS.INACTIVE ||
    rawValue === COLLABORATOR_STATUS.INVITED
  ) {
    return rawValue;
  }
  return COLLABORATOR_ALL_STATUS_FILTER;
};

/**
 * ViewModel del listado y acciones rapidas de colaboradores (KAN-78, KAN-81..KAN-86).
 * @returns {CollaboratorListViewModel}
 */
export const useCollaboratorListViewModel = (): CollaboratorListViewModel => {
  const navigate = useNavigate();
  const [searchParameters, setSearchParameters] = useSearchParams();
  const { businessId } = useCurrentBusiness();
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);

  const [resendingCollaboratorId, setResendingCollaboratorId] =
    useState<Nullable<string>>(null);
  const [limitDialog, setLimitDialog] = useState<CollaboratorLimitDialogState>({
    hasHigherPlan: false,
    isOpen: false,
    limit: null,
  });
  const [statusDialog, setStatusDialog] =
    useState<CollaboratorStatusDialogState>({
      collaborator: null,
      hasBookingsLoadError: false,
      mode: null,
      upcomingBookingsCount: 0,
    });
  const [invitationLinkDialog, setInvitationLinkDialog] =
    useState<CollaboratorInvitationLinkDialogState>({
      collaboratorName: STRING.EMPTY,
      invitationUrl: STRING.EMPTY,
      isOpen: false,
    });

  const filters: CollaboratorListFilters = {
    searchTerm: searchParameters.get(SEARCH_PARAM.SEARCH) ?? STRING.EMPTY,
    status: parseStatusFilter(
      searchParameters.get(SEARCH_PARAM.STATUS) ?? STRING.EMPTY,
    ),
  };

  const hasActiveFilters = Boolean(filters.searchTerm.trim() || filters.status);

  const pagination = useCursorPagination([
    businessId,
    filters.searchTerm,
    filters.status,
  ]);

  const listQuery = useCollaboratorListQuery(
    businessId,
    filters,
    pagination.currentCursor ?? null,
    pagination.pageNumber,
  );
  const usageQuery = useCollaboratorUsageQuery(businessId);
  const activeServicesQuery = useActiveServicesForCollaboratorQuery(businessId);
  const statusMutation = useUpdateCollaboratorStatusMutation(businessId);
  const resendMutation = useResendCollaboratorEmailMutation(businessId);

  const usage = usageQuery.data ?? null;
  const isReadOnly = usage?.isReadOnly ?? false;
  const isLimitReached =
    usage !== null &&
    typeof usage.limit === "number" &&
    usage.used >= usage.limit;

  const serviceNamesById: Record<string, string> = {};
  for (const serviceItem of activeServicesQuery.data ?? []) {
    serviceNamesById[serviceItem.id] = serviceItem.name;
  }

  const updateUrlParams = (nextSearch: string, nextStatus: string): void => {
    const nextParams = new URLSearchParams(searchParameters);
    if (nextSearch.trim()) {
      nextParams.set(SEARCH_PARAM.SEARCH, nextSearch);
    } else {
      nextParams.delete(SEARCH_PARAM.SEARCH);
    }
    if (nextStatus) {
      nextParams.set(SEARCH_PARAM.STATUS, nextStatus);
    } else {
      nextParams.delete(SEARCH_PARAM.STATUS);
    }
    setSearchParameters(nextParams, { replace: true });
  };

  const openLimitDialog = (
    limitValue: Nullable<number>,
    hasHigher: boolean,
  ): void => {
    setLimitDialog({
      hasHigherPlan: hasHigher,
      isOpen: true,
      limit: limitValue,
    });
  };

  const handleOpenDeactivateDialog = (
    collaborator: CollaboratorListItem,
  ): void => {
    setStatusDialog({
      collaborator,
      hasBookingsLoadError: false,
      mode: COLLABORATOR_STATUS_DIALOG_MODE.DEACTIVATE,
      upcomingBookingsCount: 0,
    });
    void fetchCollaboratorDetail(businessId, collaborator.id)
      .then((detail) => {
        if (!detail) {
          return;
        }
        setStatusDialog((current) =>
          current.collaborator?.id === collaborator.id &&
          current.mode === COLLABORATOR_STATUS_DIALOG_MODE.DEACTIVATE
            ? {
                ...current,
                hasBookingsLoadError: Boolean(detail.hasUpcomingBookingsError),
                upcomingBookingsCount: detail.upcomingBookingsCount,
              }
            : current,
        );
      })
      .catch(() => {
        setStatusDialog((current) =>
          current.collaborator?.id === collaborator.id &&
          current.mode === COLLABORATOR_STATUS_DIALOG_MODE.DEACTIVATE
            ? { ...current, hasBookingsLoadError: true }
            : current,
        );
      });
  };

  const handleConfirmStatusChange = async (): Promise<void> => {
    if (!statusDialog.collaborator || !statusDialog.mode) {
      return;
    }

    const isDeactivating =
      statusDialog.mode === COLLABORATOR_STATUS_DIALOG_MODE.DEACTIVATE;
    const targetStatus = isDeactivating
      ? COLLABORATOR_STATUS.INACTIVE
      : COLLABORATOR_STATUS.ACTIVE;

    try {
      await statusMutation.mutateAsync({
        businessId,
        collaboratorId: statusDialog.collaborator.id,
        targetStatus,
      });
      toast.success(
        isDeactivating
          ? t("business:collaborators.deactivate.success")
          : t("business:collaborators.reactivate.success"),
      );
      setStatusDialog({
        collaborator: null,
        mode: null,
        upcomingBookingsCount: 0,
      });
    } catch (error) {
      const mapped = error as CollaboratorMutationError;
      if (mapped.reason === COLLABORATOR_ERROR_REASON.LIMIT_REACHED) {
        setStatusDialog({
          collaborator: null,
          mode: null,
          upcomingBookingsCount: 0,
        });
        openLimitDialog(
          mapped.limit ?? usage?.limit ?? 0,
          mapped.hasHigherPlan ?? usage?.hasHigherPlan ?? false,
        );
        return;
      }
      toast.error(t(mapped.messageKey as never));
    }
  };

  const handleResendEmail = async (
    collaborator: CollaboratorListItem,
  ): Promise<void> => {
    setResendingCollaboratorId(collaborator.id);
    try {
      const result = await resendMutation.mutateAsync({
        businessId,
        collaboratorId: collaborator.id,
      });
      const isInvitation =
        result.kind === COLLABORATOR_STATUS.INVITED ||
        result.kind === COLLABORATOR_EMAIL_KIND.INVITATION;
      if (isInvitation && result.invitationToken) {
        setInvitationLinkDialog({
          collaboratorName: collaborator.fullName,
          invitationUrl: buildCollaboratorInvitationUrl(result.invitationToken),
          isOpen: true,
        });
      }
      toast.success(
        isInvitation
          ? t("business:collaborators.resend.successInvited")
          : t("business:collaborators.resend.successReset"),
      );
    } catch (error) {
      const mapped = error as CollaboratorMutationError;
      toast.error(
        mapped.reason === COLLABORATOR_ERROR_REASON.COOLDOWN_ACTIVE
          ? (t(
              mapped.messageKey as never,
              { seconds: mapped.retryAfterSeconds ?? 0 } as never,
            ) as unknown as string)
          : (t(mapped.messageKey as never) as string),
      );
    } finally {
      setResendingCollaboratorId(null);
    }
  };

  const items = listQuery.data?.items ?? [];
  const viewState = resolveViewState(listQuery, items.length);

  return {
    filters,
    handleClearFilters: (): void => {
      updateUrlParams(STRING.EMPTY, COLLABORATOR_ALL_STATUS_FILTER);
    },
    handleCloseInvitationLinkDialog: (): void => {
      setInvitationLinkDialog({
        collaboratorName: STRING.EMPTY,
        invitationUrl: STRING.EMPTY,
        isOpen: false,
      });
    },
    handleCloseLimitDialog: (): void => {
      setLimitDialog((current) => ({ ...current, isOpen: false }));
    },
    handleCloseStatusDialog: (): void => {
      setStatusDialog({
        collaborator: null,
        hasBookingsLoadError: false,
        mode: null,
        upcomingBookingsCount: 0,
      });
    },
    handleConfirmStatusChange,
    handleNavigateToDetail: (collaboratorId: string): void => {
      void navigate(
        `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}/${collaboratorId}`,
      );
    },
    handleNavigateToEdit: (collaboratorId: string): void => {
      void navigate(
        `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}/${collaboratorId}/edit`,
      );
    },
    handleNavigateToNew: (): void => {
      if (isLimitReached) {
        openLimitDialog(usage?.limit ?? 0, usage?.hasHigherPlan ?? false);
        return;
      }
      void navigate(
        `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATOR_NEW}`,
      );
    },
    handleNavigateToPermissions: (collaboratorId: string): void => {
      void navigate(
        `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}/${collaboratorId}/permissions`,
      );
    },
    handleNavigateToUpgrade: (): void => {
      setLimitDialog((current) => ({ ...current, isOpen: false }));
      void navigate(ROUTE_PATH.LANDING.PLANS);
    },
    handleNextPageClick: (): void => {
      if (listQuery.data?.nextCursor) {
        pagination.goToNextPage(listQuery.data.nextCursor);
      }
    },
    handleOpenDeactivateDialog,
    handleOpenReactivateDialog: (collaborator: CollaboratorListItem): void => {
      setStatusDialog({
        collaborator,
        mode: COLLABORATOR_STATUS_DIALOG_MODE.REACTIVATE,
        upcomingBookingsCount: 0,
      });
    },
    handlePreviousPageClick: pagination.goToPreviousPage,
    handleResendEmail,
    handleRetry: (): void => {
      void listQuery.refetch();
    },
    handleSearchChange: (searchTerm: string): void => {
      updateUrlParams(searchTerm, filters.status);
    },
    handleStatusFilterChange: (status: CollaboratorStatus | ""): void => {
      updateUrlParams(filters.searchTerm, status);
    },
    hasActiveFilters,
    hasNextPage: Boolean(listQuery.data?.nextCursor),
    hasPreviousPage: pagination.hasPreviousPage,
    invitationLinkDialog,
    isLimitReached,
    isMutatingStatus: statusMutation.isPending,
    isReadOnly,
    isResendingCollaboratorId: resendingCollaboratorId,
    items,
    limitDialog,
    pageNumber: pagination.pageNumber,
    serviceNamesById,
    statusDialog,
    totalCount: listQuery.data?.totalCount ?? 0,
    usage,
    viewState,
  };
};
