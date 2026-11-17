import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import type { CollaboratorPermission } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import {
  useCollaboratorDetailQuery,
  useCollaboratorUsageQuery,
  useUpdateCollaboratorPermissionsMutation,
  type CollaboratorMutationError,
} from "../api";
import type { CollaboratorPermissionsViewModel } from "../models";

/**
 * ViewModel para configurar los permisos de acceso al portal del colaborador (KAN-86).
 * @returns {CollaboratorPermissionsViewModel}
 */
export const useCollaboratorPermissionsViewModel =
  (): CollaboratorPermissionsViewModel => {
    const navigate = useNavigate();
    const { collaboratorId = "" } = useParams();
    const { businessId } = useCurrentBusiness();
    const { t } = useTranslation([
      I18N_NAMESPACE.BUSINESS,
      I18N_NAMESPACE.COMMON,
    ]);

    const detailQuery = useCollaboratorDetailQuery(businessId, collaboratorId);
    const usageQuery = useCollaboratorUsageQuery(businessId);
    const permissionsMutation =
      useUpdateCollaboratorPermissionsMutation(businessId);

    const [draftState, setDraftState] = useState<
      Nullable<{
        readonly permissions: CollaboratorPermission[];
        readonly snapshotKey: string;
      }>
    >(null);

    const collaborator = detailQuery.data ?? null;
    const isReadOnly = usageQuery.data?.isReadOnly ?? false;
    const currentSnapshotKey = collaborator
      ? `${collaborator.id}:${collaborator.updatedAt}`
      : "";
    const selectedPermissions =
      draftState && draftState.snapshotKey === currentSnapshotKey
        ? draftState.permissions
        : [...(collaborator?.permissions ?? [])];

    const detailPath = `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}/${collaboratorId}`;

    const handleTogglePermission = (
      permission: CollaboratorPermission,
    ): void => {
      const nextPermissions = selectedPermissions.includes(permission)
        ? selectedPermissions.filter((item) => item !== permission)
        : [...selectedPermissions, permission];
      setDraftState({
        permissions: nextPermissions,
        snapshotKey: currentSnapshotKey,
      });
    };

    const handleSave = async (): Promise<void> => {
      if (!collaborator) {
        return;
      }
      try {
        await permissionsMutation.mutateAsync({
          businessId,
          collaboratorId: collaborator.id,
          permissions: selectedPermissions,
        });
        toast.success(t("business:collaborators.permissions.success"));
        void navigate(detailPath);
      } catch (error) {
        const mapped = error as CollaboratorMutationError;
        toast.error(t(mapped.messageKey as never));
      }
    };

    return {
      collaborator,
      handleCancel: (): void => {
        void navigate(detailPath);
      },
      handleRetry: (): void => {
        void detailQuery.refetch();
      },
      handleSave,
      handleTogglePermission,
      isLoading: detailQuery.isPending,
      isNotFound:
        !detailQuery.isPending && !detailQuery.isError && collaborator === null,
      isReadOnly,
      isSaving: permissionsMutation.isPending,
      loadError: detailQuery.isError
        ? "business:collaborators.profile.loadError"
        : null,
      selectedPermissions,
    };
  };
