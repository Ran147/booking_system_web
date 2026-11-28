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
  RecaptchaField,
} from "@/components/common";
import type { AcceptInvitationFormProps } from "../models/acceptInvitation.model";

export const AcceptInvitationForm = ({
  acceptInvitationViewModel,
}: AcceptInvitationFormProps): ReactElement => {
  const { t } = useTranslation();
  const {
    businessName,
    email,
    form,
    handleRecaptchaTokenChange,
    handleSubmit,
    handleToggleConfirmationVisibility,
    handleTogglePasswordVisibility,
    isConfirmationVisible,
    isPasswordVisible,
    isSubmitDisabled,
    isSubmitting,
    language,
    newPassword,
    recaptchaResetSignal,
    recaptchaSiteKey,
  } = acceptInvitationViewModel;

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
        <p className="text-sm text-muted-foreground">
          {t("auth.invitation.businessContext", { businessName, email })}
        </p>

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.invitation.newPasswordLabel")}</FormLabel>
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
              <FormLabel>{t("auth.invitation.confirmationLabel")}</FormLabel>
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

        <RecaptchaField
          label={t("auth.invitation.recaptchaLabel")}
          language={language}
          onTokenChange={handleRecaptchaTokenChange}
          resetSignal={recaptchaResetSignal}
          siteKey={recaptchaSiteKey}
        />

        <Button
          disabled={isSubmitDisabled}
          fullWidth
          isLoading={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? t("auth.invitation.submittingLabel")
            : t("auth.invitation.submitAction")}
        </Button>
      </form>
    </Form>
  );
};
