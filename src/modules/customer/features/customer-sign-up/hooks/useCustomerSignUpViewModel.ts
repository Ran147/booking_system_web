import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import {
  DEFAULT_LANGUAGE,
  FIREBASE_ERROR_CODE,
  I18N_NAMESPACE,
  LANGUAGE,
  STRING,
  type Language,
} from "@/constants";
import { recaptchaSiteKey } from "@/services/firebase";
import type { MutationError, Nullable, NullableUndefined } from "@/types";
import { isValidationMessageKey } from "@/utils";
import { useCompleteCustomerSignUpMutation } from "../api/useCompleteCustomerSignUpMutation";
import {
  DEFAULT_CUSTOMER_SIGN_UP_FORM_VALUES,
  type VerificationEmailStatus,
} from "../constants/CustomerSignUp.constants";
import {
  customerSignUpFormSchema,
  type CustomerSignUpFormValues,
} from "../models/CustomerSignUpForm.schema";
import type { CustomerSignUpViewModel } from "../models/customerSignUp.model";

const toSupportedLanguage = (
  activeLanguage: NullableUndefined<string>,
): Language =>
  Object.values(LANGUAGE).find((language) => language === activeLanguage) ??
  DEFAULT_LANGUAGE;

/**
 * Formulario de registro del cliente (KAN-123): valida, verifica el
 * reCAPTCHA y crea la cuenta en el servidor.
 * @returns {CustomerSignUpViewModel}
 */
export const useCustomerSignUpViewModel = (): CustomerSignUpViewModel => {
  const { i18n, t } = useTranslation([
    I18N_NAMESPACE.CUSTOMER,
    I18N_NAMESPACE.VALIDATION,
    I18N_NAMESPACE.COMMON,
  ]);
  const { businessSlug } = useParams();
  const form = useForm<CustomerSignUpFormValues>({
    defaultValues: DEFAULT_CUSTOMER_SIGN_UP_FORM_VALUES,
    // First check on blur, then on every change (AC-KAN-123-03).
    mode: "onTouched",
    resolver: zodResolver(customerSignUpFormSchema),
  });
  const { errors } = form.formState;
  const completeSignUpMutation = useCompleteCustomerSignUpMutation();
  const [recaptchaToken, setRecaptchaToken] = useState<Nullable<string>>(null);
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0);
  const [submitError, setSubmitError] = useState<Nullable<string>>(null);
  const [verificationEmail, setVerificationEmail] =
    useState<Nullable<VerificationEmailStatus>>(null);
  const language = toSupportedLanguage(i18n.resolvedLanguage);

  const translateFieldError = (
    fieldError: NullableUndefined<FieldError>,
  ): NullableUndefined<string> => {
    const messageKey = fieldError?.message;
    return messageKey && isValidationMessageKey(messageKey)
      ? t(`validation:${messageKey}`)
      : undefined;
  };

  // The entered data is kept (AC-KAN-123-07); the reCAPTCHA token was used by
  // the server, so every retry needs a new one.
  const handleSignUpError = (mutationError: MutationError): void => {
    setRecaptchaToken(null);
    setRecaptchaResetSignal((previousSignal) => previousSignal + 1);
    setSubmitError(
      mutationError.code === FIREBASE_ERROR_CODE.FUNCTIONS_PERMISSION_DENIED
        ? t("validation:recaptchaRequired")
        : t(`common:${mutationError.messageKey}`),
    );
  };

  const submitSignUp = (formValues: CustomerSignUpFormValues): void => {
    if (!recaptchaToken) return;

    setSubmitError(null);
    completeSignUpMutation.mutate(
      {
        // The business page to return to after signing in (AC-KAN-127-03).
        continueUrl: `${window.location.origin}/${businessSlug ?? STRING.EMPTY}`,
        email: formValues.email,
        fullName: formValues.fullName,
        language,
        password: formValues.password,
        phone: formValues.phone,
        recaptchaToken,
      },
      {
        onError: handleSignUpError,
        onSuccess: (signUpResponse) => {
          setVerificationEmail(signUpResponse.verificationEmail);
        },
      },
    );
  };

  return {
    fieldErrors: {
      email: translateFieldError(errors.email),
      fullName: translateFieldError(errors.fullName),
      password: translateFieldError(errors.password),
      phone: translateFieldError(errors.phone),
    },
    fields: {
      email: form.register("email"),
      fullName: form.register("fullName"),
      password: form.register("password"),
      phone: form.register("phone"),
    },
    handleRecaptchaTokenChange: setRecaptchaToken,
    handleSubmit: form.handleSubmit(submitSignUp),
    isRecaptchaMissing: !recaptchaToken,
    // AC-KAN-123-10: disabled from the first click until the server answers.
    isSubmitting:
      form.formState.isSubmitting || completeSignUpMutation.isPending,
    language,
    recaptchaResetSignal,
    recaptchaSiteKey,
    submitError,
    verificationEmail,
  };
};
