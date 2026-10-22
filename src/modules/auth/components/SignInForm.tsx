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
  PasswordInput,
  RecaptchaField,
} from "@/components/common";
import { ROUTE_PATH } from "@/constants";
import { GoogleIcon } from "./GoogleIcon";
import type { SignInFormProps } from "../models/signIn.model";

export const SignInForm = ({
  signInViewModel,
}: SignInFormProps): ReactElement => {
  const { t } = useTranslation();
  const {
    form,
    handleGoogleSignIn,
    handleRecaptchaTokenChange,
    handleSubmit,
    handleTogglePasswordVisibility,
    isGoogleSubmitting,
    isPasswordVisible,
    isSubmitDisabled,
    isSubmitting,
    language,
    passwordRecoveryLocationState,
    recaptchaResetSignal,
    recaptchaSiteKey,
  } = signInViewModel;

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
        <Button
          className="h-10 font-medium border-border/80 hover:bg-muted/60 transition-colors"
          disabled={isSubmitting || isGoogleSubmitting}
          fullWidth
          isLoading={isGoogleSubmitting}
          leftIcon={GoogleIcon}
          onClick={() => {
            void handleGoogleSignIn();
          }}
          type="button"
          variant="outline"
        >
          {t("auth.signIn.googleSignInAction")}
        </Button>

        <div className="relative my-1 flex items-center justify-center text-xs text-muted-foreground uppercase">
          <span className="w-full border-t border-border" />
          <span className="bg-card px-2 text-muted-foreground">
            {t("auth.signIn.orDivider")}
          </span>
          <span className="w-full border-t border-border" />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.signIn.emailLabel")}</FormLabel>
              <FormControl>
                <InputField {...field} autoComplete="email" type="email" />
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
                  state={passwordRecoveryLocationState}
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
