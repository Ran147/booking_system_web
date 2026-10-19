import { ArrowLeft, Loader2 } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  EmptyState,
  ErrorState,
  Spinner,
} from "@/components/common";
import { ERROR_MESSAGE_KEY, I18N_NAMESPACE } from "@/constants";
import { useServiceCollaboratorsViewModel } from "@/modules/business/features/services";
import { CollaboratorItem } from "./components/CollaboratorItem";
import { CollaboratorSelectionMode } from "./components/CollaboratorSelectionMode";
import type { ServiceCollaboratorsPageProps } from "./types/ServiceCollaboratorsPage.types";

export const ServiceCollaboratorsPage = (
  props: ServiceCollaboratorsPageProps,
): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const viewModel = useServiceCollaboratorsViewModel(props);

  if (viewModel.isLoading) {
    return (
      <div
        className="flex min-h-[400px] items-center justify-center"
        data-testid="collaborators-loading-spinner"
      >
        <Spinner />
      </div>
    );
  }

  if (viewModel.isError) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-8 text-center">
        <ErrorState messageKey={ERROR_MESSAGE_KEY.NETWORK} />
        <div>
          <Button
            onClick={viewModel.onRetry}
            size={BUTTON_SIZE.SM}
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("services.list.retryAction")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={viewModel.onBack}
            size={BUTTON_SIZE.SM}
            variant={BUTTON_VARIANT.GHOST}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("services.form.backToServicesAction")}
          </Button>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("services.collaborators.title")}
            {viewModel.serviceName && (
              <span className="text-muted-foreground">
                {" "}
                — {viewModel.serviceName}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("services.collaborators.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            disabled={viewModel.isReadOnly || viewModel.isSaving}
            onClick={viewModel.onSave}
            variant={BUTTON_VARIANT.PRIMARY}
          >
            {viewModel.isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("services.collaborators.saving")}
              </>
            ) : (
              t("services.collaborators.saveAction")
            )}
          </Button>
        </div>
      </div>

      {/* Read-Only Notice */}
      {viewModel.isReadOnly && (
        <Alert data-testid="readonly-notice" variant={ALERT_VARIANT.WARNING}>
          {t("services.collaborators.readOnlyNotice")}
        </Alert>
      )}

      {/* Available Collaborators */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("services.collaborators.collaboratorListTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("services.collaborators.collaboratorListDescription")}
          </p>
        </div>

        {viewModel.collaborators.length === 0 ? (
          <EmptyState
            message={t("services.collaborators.emptyCollaborators")}
          />
        ) : (
          <div className="space-y-3">
            {viewModel.collaborators.map((collaborator) => {
              const warning = viewModel.warnings.find(
                (warningItem) => warningItem.collaboratorId === collaborator.id,
              );
              return (
                <CollaboratorItem
                  collaborator={collaborator}
                  isChecked={viewModel.selectedCollaboratorIds.includes(
                    collaborator.id,
                  )}
                  isReadOnly={viewModel.isReadOnly}
                  key={collaborator.id}
                  onToggle={viewModel.onToggleCollaborator}
                  warningCount={warning?.pendingOrConfirmedBookingsCount}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Collaborator Selection Mode Section */}
      {viewModel.hasCollaboratorsSelected ? (
        <CollaboratorSelectionMode
          isReadOnly={viewModel.isReadOnly}
          onSelectMode={viewModel.onSelectMode}
          selectedMode={viewModel.selectedMode}
        />
      ) : (
        <div
          className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground"
          data-testid="no-collaborator-notice"
        >
          {t("services.collaborators.noCollaboratorNotice")}
        </div>
      )}
    </div>
  );
};
