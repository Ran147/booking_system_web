import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  AppLink,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InputField,
  RecaptchaField,
} from "@/components/common";
import { ROUTE_PATH } from "@/constants";
import type { PasswordRecoveryFormProps } from "../models/passwordRecovery.model";

export const PasswordRecoveryForm = ({
  passwordRecoveryViewModel,
}: PasswordRecoveryFormProps): ReactElement => {
  const { t } = useTranslation();
  const {
    form,
    handleRecaptchaTokenChange,
    handleSubmit,
    isSubmitDisabled,
    isSubmitting,
    language,
    recaptchaResetSignal,
    recaptchaSiteKey,
    remainingCooldownSeconds,
  } = passwordRecoveryViewModel;
  const isInCooldown = remainingCooldownSeconds > 0;

  const resolveSubmitLabel = (): string => {
    if (isSubmitting) return t("auth.passwordRecovery.submittingLabel");
    if (isInCooldown) {
      return t("auth.passwordRecovery.cooldownLabel", {
        count: remainingCooldownSeconds,
      });
    }
    return t("auth.passwordRecovery.submitAction");
  };

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.passwordRecovery.emailLabel")}</FormLabel>
              <FormControl>
                <InputField {...field} autoComplete="email" type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <RecaptchaField
          label={t("auth.signIn.recaptchaLabel")}
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
          {resolveSubmitLabel()}
        </Button>
        <AppLink className="text-center text-sm" to={ROUTE_PATH.AUTH.SIGN_IN}>
          {t("auth.passwordRecovery.backToSignInAction")}
        </AppLink>
      </form>
    </Form>
  );
};
