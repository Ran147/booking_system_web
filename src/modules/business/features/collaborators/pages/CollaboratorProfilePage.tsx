import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_VARIANT,
  ErrorState,
  PageTemplate,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import {
  CollaboratorInvitationLinkDialog,
  CollaboratorLimitDialog,
  CollaboratorProfileActions,
  CollaboratorProfileDetails,
  CollaboratorStatusDialog,
} from "../components";
import { useCollaboratorProfileViewModel } from "../hooks";

export const CollaboratorProfilePage = (): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);
  const viewModel = useCollaboratorProfileViewModel();
  const {
    collaborator,
    cooldownSecondsRemaining,
    handleBackToList,
    handleCloseInvitationLinkDialog,
    handleCloseLimitDialog,
    handleCloseStatusDialog,
    handleConfirmStatusChange,
    handleNavigateToEdit,
    handleNavigateToPermissions,
    handleNavigateToUpgrade,
    handleOpenDeactivateDialog,
    handleOpenReactivateDialog,
    handleResendEmail,
    handleRetry,
    invitationLinkDialog,
    isLoading,
    isMutatingStatus,
    isNotFound,
    isReadOnly,
    isResendingEmail,
    limitDialog,
    loadError,
    statusDialogMode,
  } = viewModel;

  const actions =
    collaborator && !isReadOnly ? (
      <CollaboratorProfileActions
        collaborator={collaborator}
        cooldownSecondsRemaining={cooldownSecondsRemaining}
        isResendingEmail={isResendingEmail}
        onDeactivate={handleOpenDeactivateDialog}
        onEdit={handleNavigateToEdit}
        onPermissions={handleNavigateToPermissions}
        onReactivate={handleOpenReactivateDialog}
        onResendEmail={(): void => {
          void handleResendEmail();
        }}
      />
    ) : undefined;

  return (
    <PageTemplate
      actions={actions}
      title={
        collaborator?.fullName ?? t("business:collaborators.profile.title")
      }
    >
      <div className="flex flex-col gap-4">
        {isReadOnly && (
          <Alert variant={ALERT_VARIANT.WARNING}>
            {t("business:collaborators.list.readOnly")}
          </Alert>
        )}

        {isLoading && <Spinner />}

        {!isLoading && loadError && (
          <div className="flex flex-col items-center gap-3">
            <ErrorState />
            <Button
              onClick={handleRetry}
              type="button"
              variant={BUTTON_VARIANT.SECONDARY}
            >
              {t("business:collaborators.profile.retryAction")}
            </Button>
          </div>
        )}

        {!isLoading && !loadError && isNotFound && (
          <div className="flex flex-col items-start gap-3">
            <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>
              {t("business:collaborators.profile.notFound")}
            </Alert>
            <Button
              onClick={handleBackToList}
              type="button"
              variant={BUTTON_VARIANT.OUTLINE}
            >
              {t("business:collaborators.profile.backAction")}
            </Button>
          </div>
        )}

        {!isLoading && !loadError && collaborator && (
          <CollaboratorProfileDetails
            collaborator={collaborator}
            onBackToList={handleBackToList}
          />
        )}
      </div>

      <CollaboratorStatusDialog
        collaboratorName={collaborator?.fullName ?? ""}
        hasBookingsLoadError={Boolean(collaborator?.hasUpcomingBookingsError)}
        isLoading={isMutatingStatus}
        mode={statusDialogMode}
        onClose={handleCloseStatusDialog}
        onConfirm={(): void => {
          void handleConfirmStatusChange();
        }}
        upcomingBookingsCount={collaborator?.upcomingBookingsCount ?? 0}
      />

      <CollaboratorLimitDialog
        dialog={limitDialog}
        onClose={handleCloseLimitDialog}
        onUpgrade={handleNavigateToUpgrade}
      />

      <CollaboratorInvitationLinkDialog
        dialog={invitationLinkDialog}
        onClose={handleCloseInvitationLinkDialog}
      />
    </PageTemplate>
  );
};
