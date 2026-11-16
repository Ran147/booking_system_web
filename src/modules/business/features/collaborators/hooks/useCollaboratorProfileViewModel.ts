import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import { COLLABORATOR_STATUS } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import {
  useCollaboratorDetailQuery,
  useCollaboratorUsageQuery,
  useResendCollaboratorEmailMutation,
  useUpdateCollaboratorStatusMutation,
  type CollaboratorMutationError,
} from "../api";
import {
  COLLABORATOR_EMAIL_KIND,
  COLLABORATOR_ERROR_REASON,
  COLLABORATOR_RULE,
  COLLABORATOR_STATUS_DIALOG_MODE,
  type CollaboratorStatusDialogMode,
} from "../constants/CollaboratorFeature.constants";
import type {
  CollaboratorLimitDialogState,
  CollaboratorProfileViewModel,
} from "../models";

const computeRemainingSeconds = (lastSentIso: Nullable<string>): number => {
  if (!lastSentIso) {
    return 0;
  }
  const sentMillis = Date.parse(lastSentIso);
  if (Number.isNaN(sentMillis)) {
    return 0;
  }
  const elapsedMs = Date.now() - sentMillis;
  const remainingMs = COLLABORATOR_RULE.RESEND_COOLDOWN_MS - elapsedMs;
  if (remainingMs <= 0) {
    return 0;
  }
  return Math.ceil(remainingMs / COLLABORATOR_RULE.RESEND_TICK_MS);
};

/**
 * ViewModel de la ficha de detalle del colaborador (KAN-81..KAN-86).
 * @returns {CollaboratorProfileViewModel}
 */
export const useCollaboratorProfileViewModel =
  (): CollaboratorProfileViewModel => {
    const navigate = useNavigate();
    const { collaboratorId = "" } = useParams();
    const { businessId } = useCurrentBusiness();
    const { t } = useTranslation([
      I18N_NAMESPACE.BUSINESS,
      I18N_NAMESPACE.COMMON,
    ]);

    const detailQuery = useCollaboratorDetailQuery(businessId, collaboratorId);
    const usageQuery = useCollaboratorUsageQuery(businessId);
    const statusMutation = useUpdateCollaboratorStatusMutation(businessId);
    const resendMutation = useResendCollaboratorEmailMutation(businessId);

    const [statusDialogMode, setStatusDialogMode] =
      useState<Nullable<CollaboratorStatusDialogMode>>(null);
    const [limitDialog, setLimitDialog] =
      useState<CollaboratorLimitDialogState>({
        hasHigherPlan: false,
        isOpen: false,
        limit: null,
      });
    const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState(0);

    const collaborator = detailQuery.data ?? null;
    const isReadOnly = usageQuery.data?.isReadOnly ?? false;

    useEffect(() => {
      const syncRemaining = (): void => {
        setCooldownSecondsRemaining(
          computeRemainingSeconds(collaborator?.lastEmailSentAt ?? null),
        );
      };
      syncRemaining();

      if (!collaborator?.lastEmailSentAt) {
        return;
      }
      const intervalId = window.setInterval(
        syncRemaining,
        COLLABORATOR_RULE.RESEND_TICK_MS,
      );
      return (): void => {
        window.clearInterval(intervalId);
      };
    }, [collaborator?.lastEmailSentAt]);

    const handleConfirmStatusChange = async (): Promise<void> => {
      if (!collaborator || !statusDialogMode) {
        return;
      }
      const isDeactivating =
        statusDialogMode === COLLABORATOR_STATUS_DIALOG_MODE.DEACTIVATE;
      const targetStatus = isDeactivating
        ? COLLABORATOR_STATUS.INACTIVE
        : COLLABORATOR_STATUS.ACTIVE;

      try {
        await statusMutation.mutateAsync({
          businessId,
          collaboratorId: collaborator.id,
          targetStatus,
        });
        toast.success(
          isDeactivating
            ? t("business:collaborators.deactivate.success")
            : t("business:collaborators.reactivate.success"),
        );
        setStatusDialogMode(null);
      } catch (error) {
        const mapped = error as CollaboratorMutationError;
        if (mapped.reason === COLLABORATOR_ERROR_REASON.LIMIT_REACHED) {
          setStatusDialogMode(null);
          setLimitDialog({
            hasHigherPlan:
              mapped.hasHigherPlan ?? usageQuery.data?.hasHigherPlan ?? false,
            isOpen: true,
            limit: mapped.limit ?? usageQuery.data?.limit ?? 0,
          });
          return;
        }
        toast.error(t(mapped.messageKey as never));
      }
    };

    const handleResendEmail = async (): Promise<void> => {
      if (!collaborator) {
        return;
      }
      try {
        const result = await resendMutation.mutateAsync({
          businessId,
          collaboratorId: collaborator.id,
        });
        setCooldownSecondsRemaining(COLLABORATOR_RULE.RESEND_COOLDOWN_SECONDS);
        toast.success(
          result.kind === COLLABORATOR_EMAIL_KIND.INVITATION
            ? t("business:collaborators.resend.successInvited")
            : t("business:collaborators.resend.successReset"),
        );
      } catch (error) {
        const mapped = error as CollaboratorMutationError;
        if (
          mapped.reason === COLLABORATOR_ERROR_REASON.COOLDOWN_ACTIVE &&
          typeof mapped.retryAfterSeconds === "number"
        ) {
          setCooldownSecondsRemaining(mapped.retryAfterSeconds);
          toast.error(
            t(
              mapped.messageKey as never,
              { seconds: mapped.retryAfterSeconds } as never,
            ) as unknown as string,
          );
          return;
        }
        toast.error(t(mapped.messageKey as never) as string);
      }
    };

    return {
      collaborator,
      cooldownSecondsRemaining,
      handleBackToList: (): void => {
        void navigate(
          `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
        );
      },
      handleCloseLimitDialog: (): void => {
        setLimitDialog((current) => ({ ...current, isOpen: false }));
      },
      handleCloseStatusDialog: (): void => {
        setStatusDialogMode(null);
      },
      handleConfirmStatusChange,
      handleNavigateToEdit: (): void => {
        void navigate(
          `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}/${collaboratorId}/edit`,
        );
      },
      handleNavigateToPermissions: (): void => {
        void navigate(
          `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}/${collaboratorId}/permissions`,
        );
      },
      handleNavigateToUpgrade: (): void => {
        setLimitDialog((current) => ({ ...current, isOpen: false }));
        void navigate(ROUTE_PATH.LANDING.PLANS);
      },
      handleOpenDeactivateDialog: (): void => {
        setStatusDialogMode(COLLABORATOR_STATUS_DIALOG_MODE.DEACTIVATE);
      },
      handleOpenReactivateDialog: (): void => {
        setStatusDialogMode(COLLABORATOR_STATUS_DIALOG_MODE.REACTIVATE);
      },
      handleResendEmail,
      handleRetry: (): void => {
        void detailQuery.refetch();
      },
      isLoading: detailQuery.isPending,
      isMutatingStatus: statusMutation.isPending,
      isNotFound:
        !detailQuery.isPending && !detailQuery.isError && collaborator === null,
      isReadOnly,
      isResendingEmail: resendMutation.isPending,
      limitDialog,
      loadError: detailQuery.isError
        ? "business:collaborators.profile.loadError"
        : null,
      statusDialogMode,
    };
  };
