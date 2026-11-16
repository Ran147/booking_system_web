import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Badge,
  BADGE_VARIANT,
  Button,
  BUTTON_VARIANT,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  PageTemplate,
  Spinner,
  StatusBadge,
} from "@/components/common";
import { APP_TIME_ZONE, I18N_NAMESPACE } from "@/constants";
import { COLLABORATOR_STATUS, COLLABORATOR_STATUS_TONE } from "@/domain";
import { formatDateTime } from "@/utils";
import {
  CollaboratorLimitDialog,
  CollaboratorStatusDialog,
} from "../components";
import { useCollaboratorProfileViewModel } from "../hooks";

export const CollaboratorProfilePage = (): ReactElement => {
  const { i18n, t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const viewModel = useCollaboratorProfileViewModel();
  const {
    collaborator,
    cooldownSecondsRemaining,
    handleBackToList,
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
    isLoading,
    isMutatingStatus,
    isNotFound,
    isReadOnly,
    isResendingEmail,
    limitDialog,
    loadError,
    statusDialogMode,
  } = viewModel;

  const isInvited = collaborator?.status === COLLABORATOR_STATUS.INVITED;
  const isActive = collaborator?.status === COLLABORATOR_STATUS.ACTIVE;
  const isInactive = collaborator?.status === COLLABORATOR_STATUS.INACTIVE;
  const canResend = Boolean(collaborator) && (isInvited || isActive);

  const actions =
    collaborator && !isReadOnly ? (
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleNavigateToEdit}
          type="button"
          variant={BUTTON_VARIANT.OUTLINE}
        >
          {t("business:collaborators.profile.editAction")}
        </Button>
        <Button
          onClick={handleNavigateToPermissions}
          type="button"
          variant={BUTTON_VARIANT.OUTLINE}
        >
          {t("business:collaborators.profile.permissionsAction")}
        </Button>
        {canResend && (
          <Button
            disabled={cooldownSecondsRemaining > 0}
            isLoading={isResendingEmail}
            onClick={(): void => {
              void handleResendEmail();
            }}
            type="button"
            variant={BUTTON_VARIANT.SECONDARY}
          >
            {isResendingEmail
              ? t("business:collaborators.resend.sendingLabel")
              : cooldownSecondsRemaining > 0
                ? t("business:collaborators.resend.cooldownLabel", {
                    count: cooldownSecondsRemaining,
                  })
                : isInvited
                  ? t("business:collaborators.resend.invitedAction")
                  : t("business:collaborators.resend.activeAction")}
          </Button>
        )}
        {isActive && (
          <Button
            onClick={handleOpenDeactivateDialog}
            type="button"
            variant={BUTTON_VARIANT.DESTRUCTIVE}
          >
            {t("business:collaborators.deactivate.action")}
          </Button>
        )}
        {isInactive && (
          <Button
            onClick={handleOpenReactivateDialog}
            type="button"
            variant={BUTTON_VARIANT.PRIMARY}
          >
            {t("business:collaborators.reactivate.action")}
          </Button>
        )}
      </div>
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
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{collaborator.fullName}</CardTitle>
                  <StatusBadge
                    tone={COLLABORATOR_STATUS_TONE[collaborator.status]}
                  >
                    {t(`common:collaboratorStatus.${collaborator.status}`)}
                  </StatusBadge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("business:collaborators.profile.emailLabel")}
                  </p>
                  <p className="text-sm text-foreground">
                    {collaborator.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("business:collaborators.profile.phoneLabel")}
                  </p>
                  <p className="text-sm text-foreground">
                    {collaborator.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("business:collaborators.profile.specialtyLabel")}
                  </p>
                  <p className="text-sm text-foreground">
                    {collaborator.specialty ??
                      t("business:collaborators.profile.noSpecialty")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("business:collaborators.resend.lastSentLabel")}
                  </p>
                  <p className="text-sm text-foreground">
                    {collaborator.lastEmailSentAt
                      ? formatDateTime(
                          new Date(collaborator.lastEmailSentAt),
                          APP_TIME_ZONE.COSTA_RICA,
                          i18n.language,
                        )
                      : t("business:collaborators.profile.neverSent")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("business:collaborators.profile.servicesTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {collaborator.services.length > 0 ? (
                  collaborator.services.map((service) => (
                    <Badge key={service.id} variant={BADGE_VARIANT.SECONDARY}>
                      {service.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("business:collaborators.profile.noServices")}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("business:collaborators.permissions.sectionTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {collaborator.permissions.length > 0 ? (
                  collaborator.permissions.map((permission) => (
                    <Badge key={permission} variant={BADGE_VARIANT.OUTLINE}>
                      {t(
                        `business:collaborators.permissions.items.${permission}.label`,
                      )}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("business:collaborators.permissions.noPermissionsNote")}
                  </p>
                )}
              </CardContent>
            </Card>

            <div>
              <Button
                onClick={handleBackToList}
                type="button"
                variant={BUTTON_VARIANT.OUTLINE}
              >
                {t("business:collaborators.profile.backAction")}
              </Button>
            </div>
          </>
        )}
      </div>

      <CollaboratorStatusDialog
        collaboratorName={collaborator?.fullName ?? ""}
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
    </PageTemplate>
  );
};
