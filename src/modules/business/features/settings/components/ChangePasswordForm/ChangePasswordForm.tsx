import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  PasswordInput,
  PasswordStrengthMeter,
} from "@/components";
import { I18N_NAMESPACE } from "@/constants";
import { useChangePasswordFormViewModel } from "@/modules/business/features/settings";

export const ChangePasswordForm = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    form,
    handleSubmit,
    isSubmitting,
    passwordRules,
    passwordStrengthLabel,
    resolveFieldErrorMessage,
    submitErrorMessage,
    visibilityResetKey,
  } = useChangePasswordFormViewModel();

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <PasswordInput
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  error={resolveFieldErrorMessage(fieldState.error?.message)}
                  key={`current-${visibilityResetKey}`}
                  label={t("settings.password.currentPasswordLabel")}
                  required
                  visibilityResetKey={visibilityResetKey}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  error={resolveFieldErrorMessage(fieldState.error?.message)}
                  key={`new-${visibilityResetKey}`}
                  label={t("settings.password.newPasswordLabel")}
                  required
                  visibilityResetKey={visibilityResetKey}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <PasswordStrengthMeter
          label={t("settings.password.strengthLabel")}
          rules={passwordRules}
          strengthLabel={passwordStrengthLabel}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  error={resolveFieldErrorMessage(fieldState.error?.message)}
                  key={`confirm-${visibilityResetKey}`}
                  label={t("settings.password.confirmPasswordLabel")}
                  required
                  visibilityResetKey={visibilityResetKey}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {submitErrorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {submitErrorMessage}
          </p>
        ) : null}

        <div className="flex justify-end border-t border-border pt-4">
          <Button
            disabled={isSubmitting}
            isLoading={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? t("settings.password.submitting")
              : t("settings.password.submitAction")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
