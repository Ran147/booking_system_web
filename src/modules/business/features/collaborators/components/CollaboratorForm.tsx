import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_VARIANT,
  CheckboxField,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InputField,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
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
    I18N_NAMESPACE.VALIDATION,
  ]);
  const {
    activeServices,
    form,
    handleCancel,
    handleSubmit,
    handleTogglePermission,
    handleToggleService,
    isEditMode,
    isEmailLocked,
    isReadOnly,
    isSubmitting,
    removedServicesBookingsCount,
    selectedPermissions,
    selectedServiceIds,
    serverErrorKey,
  } = viewModel;

  return (
    <Form {...form}>
      <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit}>
        {serverErrorKey && (
          <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>
            {t(serverErrorKey as never)}
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("business:collaborators.form.fullNameLabel")}
                </FormLabel>
                <FormControl>
                  <InputField
                    {...field}
                    disabled={isReadOnly || isSubmitting}
                    placeholder={t(
                      "business:collaborators.form.fullNamePlaceholder",
                    )}
                    type="text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("business:collaborators.form.emailLabel")}
                </FormLabel>
                <FormControl>
                  <InputField
                    {...field}
                    disabled={isReadOnly || isEmailLocked || isSubmitting}
                    helperText={
                      isEmailLocked
                        ? t("business:collaborators.edit.emailLockedHint")
                        : undefined
                    }
                    placeholder={t(
                      "business:collaborators.form.emailPlaceholder",
                    )}
                    type="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("business:collaborators.form.phoneLabel")}
                </FormLabel>
                <FormControl>
                  <InputField
                    {...field}
                    disabled={isReadOnly || isSubmitting}
                    placeholder={t(
                      "business:collaborators.form.phonePlaceholder",
                    )}
                    type="tel"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("business:collaborators.form.specialtyLabel")}
                </FormLabel>
                <FormControl>
                  <InputField
                    {...field}
                    disabled={isReadOnly || isSubmitting}
                    placeholder={t(
                      "business:collaborators.form.specialtyPlaceholder",
                    )}
                    type="text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-medium text-foreground">
              {t("business:collaborators.form.servicesSectionTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("business:collaborators.form.servicesRequiredHint")}
            </p>
          </div>
          {removedServicesBookingsCount > 0 && (
            <Alert variant={ALERT_VARIANT.WARNING}>
              {t("business:collaborators.edit.serviceHasBookingsWarning", {
                count: removedServicesBookingsCount,
              })}
            </Alert>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {activeServices.map((service) => (
              <CheckboxField
                checked={selectedServiceIds.includes(service.id)}
                disabled={isReadOnly || isSubmitting}
                key={service.id}
                label={service.name}
                name={`service-${service.id}`}
                onChange={(): void => {
                  handleToggleService(service.id);
                }}
              />
            ))}
          </div>
          {form.formState.errors.serviceIds?.message && (
            <p className="text-sm text-destructive">
              {t(form.formState.errors.serviceIds.message as never)}
            </p>
          )}
        </div>

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
              {isEditMode
                ? isSubmitting
                  ? t("business:collaborators.edit.submittingLabel")
                  : t("business:collaborators.edit.submitAction")
                : isSubmitting
                  ? t("business:collaborators.create.submittingLabel")
                  : t("business:collaborators.create.submitAction")}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
