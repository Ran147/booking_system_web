import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, Form } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { PASSWORD_FIELD_NAME } from "../constants";
import type { ChangePasswordViewModel } from "../models";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

export interface ChangePasswordFormProps {
  viewModel: ChangePasswordViewModel;
}

export const ChangePasswordForm = ({
  viewModel,
}: ChangePasswordFormProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const newPassword = viewModel.form.watch(PASSWORD_FIELD_NAME.NEW_PASSWORD);

  return (
    <Form {...viewModel.form}>
      <form
        className="flex flex-col gap-6"
        noValidate
        onSubmit={viewModel.handleSubmit}
      >
        <PasswordInput
          disabled={viewModel.isSubmitting}
          label={t("profile.password.currentPasswordLabel")}
          name={PASSWORD_FIELD_NAME.CURRENT_PASSWORD}
          viewModel={viewModel}
        />
        <PasswordInput
          disabled={viewModel.isSubmitting}
          label={t("profile.password.newPasswordLabel")}
          name={PASSWORD_FIELD_NAME.NEW_PASSWORD}
          viewModel={viewModel}
        />
        <PasswordStrengthMeter password={newPassword} />
        <PasswordInput
          disabled={viewModel.isSubmitting}
          label={t("profile.password.confirmationLabel")}
          name={PASSWORD_FIELD_NAME.CONFIRMATION}
          viewModel={viewModel}
        />
        <div className="flex justify-end border-t border-border pt-4">
          <Button
            disabled={!viewModel.canSubmit}
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
