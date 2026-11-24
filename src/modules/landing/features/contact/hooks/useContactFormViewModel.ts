import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch, type FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { recaptchaSiteKey } from "@/services/firebase/recaptchaSiteKey";
import type { Nullable, NullableUndefined } from "@/shared/types";
import { isValidationMessageKey } from "@/utils";
import { sendContactMessage } from "../api/sendContactMessage";
import { CONTACT_FORM_CONSTANTS } from "../constants/contactForm.constants";
import type {
  ContactFormFieldErrors,
  ContactFormViewModel,
} from "../models/contactForm.model";
import {
  contactFormSchema,
  type ContactFormData,
} from "../models/contactForm.schema";

interface UseContactFormViewModelOptions {
  readonly onSubmitSuccess?: () => void;
}

export const useContactFormViewModel = (
  options?: UseContactFormViewModelOptions,
): ContactFormViewModel => {
  const { i18n, t } = useTranslation([
    I18N_NAMESPACE.LANDING,
    I18N_NAMESPACE.VALIDATION,
  ]);
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0);
  const [serverError, setServerError] = useState<Nullable<string>>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ContactFormData>({
    defaultValues: {
      email: "",
      message: "",
      name: "",
      recaptchaToken: "",
      subject: "",
    },
    mode: "onBlur",
    resolver: zodResolver(contactFormSchema),
  });

  const {
    formState: { errors, isSubmitting },
    register,
    reset,
    setValue,
  } = form;

  const recaptchaToken = useWatch({
    control: form.control,
    name: CONTACT_FORM_CONSTANTS.FIELD_NAMES.RECAPTCHA_TOKEN,
  });
  const isSubmitDisabled = isSubmitting || !recaptchaToken;

  const language = i18n?.language?.startsWith("es") ? "es" : "en";

  const translateFieldError = (
    fieldError: NullableUndefined<FieldError>,
  ): NullableUndefined<string> => {
    const messageKey = fieldError?.message;
    if (!messageKey) return undefined;
    if (isValidationMessageKey(messageKey)) {
      return t(`validation:${messageKey}`);
    }
    return undefined;
  };

  const fieldErrors: ContactFormFieldErrors = {
    email: translateFieldError(errors.email),
    message: translateFieldError(errors.message),
    name: translateFieldError(errors.name),
    subject: translateFieldError(errors.subject),
  };

  const handleRecaptchaTokenChange = (token: Nullable<string>): void => {
    setValue(CONTACT_FORM_CONSTANTS.FIELD_NAMES.RECAPTCHA_TOKEN, token ?? "", {
      shouldValidate: Boolean(token),
    });
  };

  const handleDismissFeedback = (): void => {
    setIsSuccess(false);
    setServerError(null);
  };

  const resetRecaptcha = (): void => {
    setValue(CONTACT_FORM_CONSTANTS.FIELD_NAMES.RECAPTCHA_TOKEN, "");
    setRecaptchaResetSignal((previous) => previous + 1);
  };

  const handleSubmit = form.handleSubmit(
    async (contactFormData: ContactFormData) => {
      setServerError(null);
      setIsSuccess(false);

      try {
        await sendContactMessage(contactFormData);
        setIsSuccess(true);
        reset({
          email: "",
          message: "",
          name: "",
          recaptchaToken: "",
          subject: "",
        });
        resetRecaptcha();
        options?.onSubmitSuccess?.();
      } catch {
        setServerError(t("contact.form.serverError"));
        resetRecaptcha();
      }
    },
  );

  return {
    fieldErrors,
    handleDismissFeedback,
    handleRecaptchaTokenChange,
    handleSubmit,
    isSubmitDisabled,
    isSubmitting,
    isSuccess,
    language,
    recaptchaResetSignal,
    recaptchaSiteKey,
    register,
    serverError,
  };
};
