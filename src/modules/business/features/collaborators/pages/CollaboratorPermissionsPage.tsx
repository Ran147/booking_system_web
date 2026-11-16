import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_VARIANT,
  Card,
  CardContent,
  ErrorState,
  PageTemplate,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { CollaboratorPermissionsCheckboxes } from "../components";
import { useCollaboratorPermissionsViewModel } from "../hooks";

export const CollaboratorPermissionsPage = (): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const viewModel = useCollaboratorPermissionsViewModel();
  const {
    collaborator,
    handleCancel,
    handleRetry,
    handleSave,
    handleTogglePermission,
    isLoading,
    isNotFound,
    isReadOnly,
    isSaving,
    loadError,
    selectedPermissions,
  } = viewModel;

  return (
    <PageTemplate
      description={
        collaborator
          ? t("business:collaborators.permissions.description", {
              name: collaborator.fullName,
            })
          : undefined
      }
      title={t("business:collaborators.permissions.title")}
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
              onClick={handleCancel}
              type="button"
              variant={BUTTON_VARIANT.OUTLINE}
            >
              {t("business:collaborators.profile.backAction")}
            </Button>
          </div>
        )}

        {!isLoading && !loadError && collaborator && (
          <Card>
            <CardContent className="flex flex-col gap-6 pt-6">
              <p className="text-sm text-muted-foreground">
                {t("business:collaborators.permissions.noPermissionsNote")}
              </p>

              <CollaboratorPermissionsCheckboxes
                disabled={isReadOnly || isSaving}
                onToggle={handleTogglePermission}
                selectedPermissions={selectedPermissions}
              />

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  disabled={isSaving}
                  onClick={handleCancel}
                  type="button"
                  variant={BUTTON_VARIANT.OUTLINE}
                >
                  {t("common:actions.cancel")}
                </Button>
                {!isReadOnly && (
                  <Button
                    isLoading={isSaving}
                    onClick={(): void => {
                      void handleSave();
                    }}
                    type="button"
                  >
                    {isSaving
                      ? t("business:collaborators.permissions.savingLabel")
                      : t("business:collaborators.permissions.saveAction")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTemplate>
  );
};
