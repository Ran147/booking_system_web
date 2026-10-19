import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "@/components/common";
import {
  ERROR_MESSAGE_KEY,
  FIREBASE_ERROR_CODE,
  I18N_NAMESPACE,
  ROUTE_PATH,
} from "@/constants";
import {
  BUSINESS_STATUS,
  COLLABORATOR_PERMISSION,
  USER_ROLE,
  type BusinessStatus,
  type UserRole,
} from "@/domain";
import { SESSION_STATUS, useCurrentBusiness, useSession } from "@/modules/auth";
import type { Nullable } from "@/types";
import {
  fetchBusinessStatus,
  fetchServiceCollaboratorsData,
  serviceQueryKeys,
  useUpdateServiceCollaboratorsMutation,
} from "../api";
import {
  COLLABORATOR_SELECTION_MODE,
  type CollaboratorSelectionMode,
} from "../constants/ServiceCollaborators.constants";
import type { ServiceCollaboratorsData } from "../models/ServiceCollaborators.interface";
import type {
  CollaboratorWarningInfo,
  ServiceCollaboratorsViewModel,
} from "../models/ServiceCollaboratorsViewModel.interface";

export interface UseServiceCollaboratorsViewModelOptions {
  readonly businessStatus?: BusinessStatus;
  readonly initialData?: ServiceCollaboratorsData;
  readonly onNavigate?: (path: string) => void;
  readonly serviceId?: string;
  readonly userPermissions?: readonly string[];
  readonly userRole?: UserRole;
}

export const useServiceCollaboratorsViewModel = (
  options: UseServiceCollaboratorsViewModelOptions = {},
): ServiceCollaboratorsViewModel => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const navigate = useNavigate();
  const routeParameters = useParams<{ serviceId: string }>();
  const serviceId = options.serviceId ?? routeParameters.serviceId ?? "";
  const { businessId } = useCurrentBusiness();
  const session = useSession();

  const updateMutation = useUpdateServiceCollaboratorsMutation();

  const currentRole =
    options.userRole ??
    (session.status === SESSION_STATUS.SIGNED_IN ? session.role : null);

  const permissions = options.userPermissions ?? [];

  // Check collaborator manage_services permission (AC-KAN-61-07)
  const isUnauthorizedCollaborator =
    currentRole === USER_ROLE.COLLABORATOR &&
    !permissions.includes(COLLABORATOR_PERMISSION.MANAGE_SERVICES);

  useEffect(() => {
    if (isUnauthorizedCollaborator) {
      if (options.onNavigate) {
        options.onNavigate(ROUTE_PATH.BUSINESS.ROOT);
      } else {
        navigate(ROUTE_PATH.BUSINESS.ROOT);
      }
    }
  }, [isUnauthorizedCollaborator, navigate, options]);

  const businessStatusQuery = useQuery({
    enabled: options.businessStatus === undefined,
    initialData: options.businessStatus,
    queryFn: () => fetchBusinessStatus(businessId),
    queryKey: ["businessStatus", businessId],
  });

  const businessStatus: BusinessStatus =
    options.businessStatus ??
    businessStatusQuery.data ??
    BUSINESS_STATUS.ACTIVE;

  const isReadOnly =
    businessStatus === BUSINESS_STATUS.INACTIVE ||
    businessStatus === BUSINESS_STATUS.SUSPENDED;

  const collaboratorsQuery = useQuery<ServiceCollaboratorsData>({
    enabled: options.initialData === undefined && Boolean(serviceId),
    initialData: options.initialData,
    queryFn: () => fetchServiceCollaboratorsData(businessId, serviceId),
    queryKey: serviceQueryKeys.collaborators(businessId, serviceId),
  });

  const rawCollaborators = useMemo(() => {
    return (
      collaboratorsQuery.data?.collaborators ??
      options.initialData?.collaborators ??
      []
    );
  }, [
    collaboratorsQuery.data?.collaborators,
    options.initialData?.collaborators,
  ]);
  const serviceName =
    collaboratorsQuery.data?.serviceName ??
    options.initialData?.serviceName ??
    "";
  const defaultMode =
    collaboratorsQuery.data?.currentSelectionMode ??
    options.initialData?.currentSelectionMode ??
    COLLABORATOR_SELECTION_MODE.CUSTOMER_CHOICE;

  const defaultAssignedIds = useMemo(() => {
    return rawCollaborators
      .filter((collaborator) => collaborator.isAssigned)
      .map((collaborator) => collaborator.id);
  }, [rawCollaborators]);

  const [userSelectedCollaboratorIds, setUserSelectedCollaboratorIds] =
    useState<Nullable<readonly string[]>>(null);

  const [userSelectedMode, setUserSelectedMode] =
    useState<Nullable<CollaboratorSelectionMode>>(null);

  const selectedCollaboratorIds =
    userSelectedCollaboratorIds ?? defaultAssignedIds;

  const selectedMode = userSelectedMode ?? defaultMode;

  const handleToggleCollaborator = (collaboratorId: string): void => {
    if (isReadOnly) {
      return;
    }
    const currentSelected = selectedCollaboratorIds;
    const nextSelected = currentSelected.includes(collaboratorId)
      ? currentSelected.filter((id) => id !== collaboratorId)
      : [...currentSelected, collaboratorId];
    setUserSelectedCollaboratorIds(nextSelected);
  };

  const handleSelectMode = (mode: CollaboratorSelectionMode): void => {
    if (isReadOnly) {
      return;
    }
    setUserSelectedMode(mode);
  };

  const warnings: CollaboratorWarningInfo[] = rawCollaborators
    .filter((collaborator) => {
      const wasAssigned = collaborator.isAssigned;
      const isNowUnselected = !selectedCollaboratorIds.includes(
        collaborator.id,
      );
      return (
        wasAssigned &&
        isNowUnselected &&
        collaborator.pendingOrConfirmedBookingsCount > 0
      );
    })
    .map((collaborator) => ({
      collaboratorId: collaborator.id,
      collaboratorName: collaborator.fullName,
      pendingOrConfirmedBookingsCount:
        collaborator.pendingOrConfirmedBookingsCount,
    }));

  const handleSave = async (): Promise<void> => {
    if (isReadOnly) {
      toast.error(t("business:errors.readOnly"));
      return;
    }

    try {
      await updateMutation.mutateAsync({
        businessId,
        collaboratorIds: selectedCollaboratorIds,
        collaboratorSelection:
          selectedCollaboratorIds.length === 0 ? null : selectedMode,
        serviceId,
      });
      toast.success(t("business:services.collaborators.saveSuccess"));
    } catch (error: unknown) {
      const maybeError = error as { code?: string; message?: string };
      if (maybeError?.code === FIREBASE_ERROR_CODE.FAILED_PRECONDITION) {
        toast.error(t("business:errors.readOnly"));
      } else if (
        maybeError?.code === FIREBASE_ERROR_CODE.PERMISSION_DENIED ||
        maybeError?.code === FIREBASE_ERROR_CODE.FUNCTIONS_PERMISSION_DENIED
      ) {
        toast.error(
          t(ERROR_MESSAGE_KEY.PERMISSION_DENIED, {
            ns: I18N_NAMESPACE.COMMON,
          }),
        );
      } else {
        toast.error(
          t(ERROR_MESSAGE_KEY.NETWORK, { ns: I18N_NAMESPACE.COMMON }),
        );
      }
    }
  };

  const handleBack = (): void => {
    const targetPath = `/business/${ROUTE_PATH.BUSINESS.SERVICES}`;
    if (options.onNavigate) {
      options.onNavigate(targetPath);
    } else {
      navigate(targetPath);
    }
  };

  const handleRetry = (): void => {
    void collaboratorsQuery.refetch();
  };

  return {
    collaborators: rawCollaborators,
    hasCollaboratorsSelected: selectedCollaboratorIds.length > 0,
    isError: collaboratorsQuery.isError,
    isLoading: collaboratorsQuery.isLoading && !options.initialData,
    isReadOnly,
    isSaving: updateMutation.isPending,
    onBack: handleBack,
    onRetry: handleRetry,
    onSave: handleSave,
    onSelectMode: handleSelectMode,
    onToggleCollaborator: handleToggleCollaborator,
    selectedCollaboratorIds,
    selectedMode,
    serviceName,
    warnings,
  };
};
