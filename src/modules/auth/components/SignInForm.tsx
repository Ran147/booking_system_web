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
  Input,
  PasswordInput,
  RecaptchaField,
} from "@/components/common";
import { ROUTE_PATH } from "@/constants";
import type { SignInFormProps } from "../models/signIn.model";

export const SignInForm = ({
  signInViewModel,
}: SignInFormProps): ReactElement => {
  const { t } = useTranslation();
  const {
    form,
    handleRecaptchaTokenChange,
    handleSubmit,
    handleTogglePasswordVisibility,
    isPasswordVisible,
    isSubmitDisabled,
    isSubmitting,
    language,
    recaptchaResetSignal,
    recaptchaSiteKey,
  } = signInViewModel;

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.signIn.emailLabel")}</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="email" type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-2">
                <FormLabel>{t("auth.signIn.passwordLabel")}</FormLabel>
                <AppLink
                  className="text-sm"
                  to={ROUTE_PATH.AUTH.PASSWORD_RECOVERY}
                >
                  {t("auth.signIn.forgotPassword")}
                </AppLink>
              </div>
              <FormControl>
                <PasswordInput
                  {...field}
                  autoComplete="current-password"
                  isVisible={isPasswordVisible}
                  onToggleVisibility={handleTogglePasswordVisibility}
                />
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
          {isSubmitting
            ? t("auth.signIn.submittingLabel")
            : t("auth.signIn.submitAction")}
        </Button>
      </form>
    </Form>
  );
};
