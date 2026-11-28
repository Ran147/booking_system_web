import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  InputField,
  PasswordInput,
  RecaptchaField,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { CustomerSignUpFormProps } from "../models/customerSignUp.model";

export const CustomerSignUpForm = ({
  customerSignUpViewModel,
}: CustomerSignUpFormProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.CUSTOMER,
    I18N_NAMESPACE.VALIDATION,
  ]);
  const {
    fieldErrors,
    fields,
    handleRecaptchaTokenChange,
    handleSubmit,
    isRecaptchaMissing,
    isSubmitting,
    language,
    recaptchaResetSignal,
    recaptchaSiteKey,
    submitError,
  } = customerSignUpViewModel;

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
      <InputField
        {...fields.fullName}
        autoComplete="name"
        error={fieldErrors.fullName}
        label={t("signUp.form.fullNameLabel")}
        required
      />
      <InputField
        {...fields.phone}
        autoComplete="tel"
        error={fieldErrors.phone}
        label={t("signUp.form.phoneLabel")}
        required
        type="tel"
      />
      <InputField
        {...fields.email}
        autoComplete="email"
        error={fieldErrors.email}
        label={t("signUp.form.emailLabel")}
        required
        type="email"
      />
      <PasswordInput
        {...fields.password}
        autoComplete="new-password"
        error={fieldErrors.password}
        label={t("signUp.form.passwordLabel")}
        required
      />
      <RecaptchaField
        label={t("signUp.form.recaptchaLabel")}
        language={language}
        onTokenChange={handleRecaptchaTokenChange}
        resetSignal={recaptchaResetSignal}
        siteKey={recaptchaSiteKey}
      />
      {isRecaptchaMissing && (
        <p className="text-sm text-muted-foreground">
          {t("validation:recaptchaRequired")}
        </p>
      )}
      {submitError && <Alert>{submitError}</Alert>}
      <Button
        disabled={isRecaptchaMissing}
        fullWidth
        isLoading={isSubmitting}
        type="submit"
      >
        {t("signUp.form.submitAction")}
      </Button>
    </form>
  );
};
