import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Form,
  FormField,
  FormItem,
  PasswordInput,
  PasswordStrengthMeter,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { ChangePasswordFormProps } from "../models";

export const ChangePasswordForm = ({
  viewModel,
}: ChangePasswordFormProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);

  return (
    <Form {...viewModel.form}>
      <form
        className="flex flex-col gap-6"
        noValidate
        onSubmit={viewModel.handleSubmit}
      >
        <FormField
          control={viewModel.form.control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <FormItem>
              <PasswordInput
                autoComplete="current-password"
                disabled={viewModel.isSubmitting}
                error={viewModel.resolveFieldErrorMessage(
                  fieldState.error?.message,
                )}
                label={t("profile.password.currentPasswordLabel")}
                required
                visibilityResetKey={viewModel.visibilityResetKey}
                {...field}
              />
            </FormItem>
          )}
        />
        <FormField
          control={viewModel.form.control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <FormItem>
              <PasswordInput
                autoComplete="new-password"
                disabled={viewModel.isSubmitting}
                error={viewModel.resolveFieldErrorMessage(
                  fieldState.error?.message,
                )}
                label={t("profile.password.newPasswordLabel")}
                required
                visibilityResetKey={viewModel.visibilityResetKey}
                {...field}
              />
            </FormItem>
          )}
        />
        <PasswordStrengthMeter password={viewModel.newPassword} />
        <FormField
          control={viewModel.form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <FormItem>
              <PasswordInput
                autoComplete="new-password"
                disabled={viewModel.isSubmitting}
                error={viewModel.resolveFieldErrorMessage(
                  fieldState.error?.message,
                )}
                label={t("profile.password.confirmationLabel")}
                required
                visibilityResetKey={viewModel.visibilityResetKey}
                {...field}
              />
            </FormItem>
          )}
        />
        {viewModel.submitErrorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {viewModel.submitErrorMessage}
          </p>
        ) : null}
        <div className="flex justify-end border-t border-border pt-4">
          <Button
            disabled={viewModel.isSubmitting}
            isLoading={viewModel.isSubmitting}
            type="submit"
            variant="primary"
          >
            {viewModel.isSubmitting
              ? t("profile.password.saving")
              : t("profile.password.saveAction")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
