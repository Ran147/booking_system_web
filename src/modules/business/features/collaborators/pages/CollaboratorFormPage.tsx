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
import { CollaboratorForm, CollaboratorLimitDialog } from "../components";
import { useCollaboratorFormViewModel } from "../hooks";

export const CollaboratorFormPage = (): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const viewModel = useCollaboratorFormViewModel();
  const {
    handleCancel,
    handleCloseLimitDialog,
    handleNavigateToServices,
    handleNavigateToUpgrade,
    hasNoActiveServices,
    isEditMode,
    isLoading,
    isReadOnly,
    limitDialog,
    loadError,
  } = viewModel;

  const title = isEditMode
    ? t("business:collaborators.edit.title")
    : t("business:collaborators.create.title");

  return (
    <PageTemplate title={title}>
      <div className="flex flex-col gap-4">
        {isReadOnly && (
          <Alert variant={ALERT_VARIANT.WARNING}>
            {t("business:collaborators.list.readOnly")}
          </Alert>
        )}

        {isLoading && <Spinner />}

        {!isLoading && loadError && <ErrorState />}

        {!isLoading && !loadError && hasNoActiveServices && (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 pt-6">
              <Alert variant={ALERT_VARIANT.WARNING}>
                {t("business:collaborators.create.noActiveServices")}
              </Alert>
              <div className="flex gap-3">
                <Button onClick={handleNavigateToServices} type="button">
                  {t("business:collaborators.create.noActiveServicesAction")}
                </Button>
                <Button
                  onClick={handleCancel}
                  type="button"
                  variant={BUTTON_VARIANT.OUTLINE}
                >
                  {t("common:actions.cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !loadError && !hasNoActiveServices && (
          <Card>
            <CardContent className="pt-6">
              <CollaboratorForm viewModel={viewModel} />
            </CardContent>
          </Card>
        )}
      </div>

      <CollaboratorLimitDialog
        dialog={limitDialog}
        onClose={handleCloseLimitDialog}
        onUpgrade={handleNavigateToUpgrade}
      />
    </PageTemplate>
  );
};
