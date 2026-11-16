import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_VARIANT,
  Form,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { CollaboratorFormFields } from "./CollaboratorFormFields";
import { CollaboratorFormServicesSection } from "./CollaboratorFormServicesSection";
import { CollaboratorPermissionsCheckboxes } from "./CollaboratorPermissionsCheckboxes";
import type { CollaboratorFormViewModel } from "../models";

interface CollaboratorFormProps {
  readonly viewModel: CollaboratorFormViewModel;
}

export const CollaboratorForm = ({
  viewModel,
}: CollaboratorFormProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const {
    activeServices,
    form,
    handleCancel,
    handleSubmit,
    handleTogglePermission,
    handleToggleService,
    hasUpcomingBookingsError,
    isEditMode,
    isEmailLocked,
    isReadOnly,
    isSubmitting,
    removedServicesBookingsCount,
    selectedPermissions,
    selectedServiceIds,
    serverErrorKey,
  } = viewModel;

  const submitLabel = isEditMode
    ? isSubmitting
      ? t("business:collaborators.edit.submittingLabel")
      : t("business:collaborators.edit.submitAction")
    : isSubmitting
      ? t("business:collaborators.create.submittingLabel")
      : t("business:collaborators.create.submitAction");

  return (
    <Form {...form}>
      <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit}>
        {serverErrorKey && (
          <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>
            {t(serverErrorKey as never)}
          </Alert>
        )}

        <CollaboratorFormFields
          form={form}
          isEmailLocked={isEmailLocked}
          isReadOnly={isReadOnly}
          isSubmitting={isSubmitting}
        />

        <CollaboratorFormServicesSection
          activeServices={activeServices}
          errorMessageKey={form.formState.errors.serviceIds?.message}
          hasUpcomingBookingsError={hasUpcomingBookingsError}
          isReadOnly={isReadOnly}
          isSubmitting={isSubmitting}
          onToggleService={handleToggleService}
          removedServicesBookingsCount={removedServicesBookingsCount}
          selectedServiceIds={selectedServiceIds}
        />

        {!isEditMode && (
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-medium text-foreground">
              {t("business:collaborators.form.permissionsSectionTitle")}
            </h2>
            <CollaboratorPermissionsCheckboxes
              disabled={isReadOnly || isSubmitting}
              onToggle={handleTogglePermission}
              selectedPermissions={selectedPermissions}
            />
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            disabled={isSubmitting}
            onClick={handleCancel}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("common:actions.cancel")}
          </Button>
          {!isReadOnly && (
            <Button isLoading={isSubmitting} type="submit">
              {submitLabel}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
