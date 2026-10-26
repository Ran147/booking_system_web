import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, RecaptchaField } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import { AccountSection } from "./AccountSection";
import { BusinessSection } from "./BusinessSection";
import { PersonalDataSection } from "./PersonalDataSection";
import { SignUpSubmitAlert } from "./SignUpSubmitAlert";
import { useSubscriberSignUpFormViewModel } from "../hooks/useSubscriberSignUpFormViewModel";
import type { SubscriberSignUpFormProps } from "../models/SubscriberSignUpFormViewModel.interface";

export const SubscriberSignUpForm = (
  subscriberSignUpFormProps: SubscriberSignUpFormProps,
): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const {
    businessSlugHelperText,
    fieldErrors,
    fields,
    handleRecaptchaTokenChange,
    handleSubmit,
    handleUnlockEmail,
    isEmailReadOnly,
    isRecaptchaMissing,
    isSubmitting,
    language,
    password,
    recaptchaResetSignal,
    recaptchaSiteKey,
    submitError,
  } = useSubscriberSignUpFormViewModel(subscriberSignUpFormProps);

  return (
    <form className="flex flex-col gap-8" noValidate onSubmit={handleSubmit}>
      <PersonalDataSection fieldErrors={fieldErrors} fields={fields} />
      <AccountSection
        fieldErrors={fieldErrors}
        fields={fields}
        handleUnlockEmail={handleUnlockEmail}
        isEmailReadOnly={isEmailReadOnly}
        password={password}
      />
      <BusinessSection
        businessSlugHelperText={businessSlugHelperText}
        fieldErrors={fieldErrors}
        fields={fields}
      />
      <RecaptchaField
        label={t("subscriberSignUp.form.recaptchaLabel")}
        language={language}
        onTokenChange={handleRecaptchaTokenChange}
        resetSignal={recaptchaResetSignal}
        siteKey={recaptchaSiteKey}
      />
      {submitError ? <SignUpSubmitAlert submitError={submitError} /> : null}
      <Button
        disabled={isRecaptchaMissing}
        fullWidth
        isLoading={isSubmitting}
        type="submit"
      >
        {t("subscriberSignUp.form.submitAction")}
      </Button>
    </form>
  );
};
