import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  PasswordInput,
  PasswordStrengthMeter,
} from "@/components/common";
import type { PasswordResetFormProps } from "../models/passwordReset.model";

export const PasswordResetForm = ({
  passwordResetViewModel,
}: PasswordResetFormProps): ReactElement => {
  const { t } = useTranslation();
  const {
    form,
    handleSubmit,
    handleToggleConfirmationVisibility,
    handleTogglePasswordVisibility,
    isConfirmationVisible,
    isPasswordVisible,
    isSubmitting,
    newPassword,
  } = passwordResetViewModel;

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.passwordReset.newPasswordLabel")}</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  autoComplete="new-password"
                  isVisible={isPasswordVisible}
                  onToggleVisibility={handleTogglePasswordVisibility}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <PasswordStrengthMeter password={newPassword} />
        <FormField
          control={form.control}
          name="confirmation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.passwordReset.confirmationLabel")}</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  autoComplete="new-password"
                  isVisible={isConfirmationVisible}
                  onToggleVisibility={handleToggleConfirmationVisibility}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button fullWidth isLoading={isSubmitting} type="submit">
          {isSubmitting
            ? t("auth.passwordReset.submittingLabel")
            : t("auth.passwordReset.submitAction")}
        </Button>
      </form>
    </Form>
  );
};
