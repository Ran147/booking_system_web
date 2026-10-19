import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { DEFAULT_LANGUAGE, STRING } from "@/constants";
import { recaptchaSiteKey } from "@/services/firebase";
import type { Nullable, NullableRef } from "@/types";
import { useCooldownCountdown } from "./useCooldownCountdown";
import { useRequestPasswordResetMutation } from "../api/useRequestPasswordResetMutation";
import { PASSWORD_RECOVERY } from "../constants/PasswordRecovery.constants";
import { DEFAULT_PASSWORD_RECOVERY_FORM_VALUES } from "../constants/PasswordRecoveryFormDefaults.constants";
import type { PasswordResetErrorKey } from "../constants/PasswordResetErrorKey.constants";
import {
  passwordRecoveryFormSchema,
  type PasswordRecoveryFormValues,
} from "../models/PasswordRecoveryForm.schema";
import type { PasswordRecoveryLocationState } from "../models/PasswordRecoveryLocationState.interface";
import type { PasswordResetError } from "../models/PasswordReset.mutation";
import type { PasswordRecoveryViewModel } from "../models/passwordRecovery.model";

// The sign-in page may hand over the email it had typed (AC-KAN-36-01).
const readInitialEmail = (locationState: unknown): string => {
  const { email } = (locationState ?? {}) as PasswordRecoveryLocationState;
  return typeof email === "string" ? email : STRING.EMPTY;
};

/**
 * Estado, envío, errores y cuenta atrás de pedir el enlace de recuperación (US-36).
 * @returns {PasswordRecoveryViewModel}
 */
export const usePasswordRecoveryViewModel = (): PasswordRecoveryViewModel => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const requestPasswordResetMutation = useRequestPasswordResetMutation();
  const { remainingSeconds, startCooldown } = useCooldownCountdown(
    PASSWORD_RECOVERY.COOLDOWN_SECONDS,
  );
  const serverErrorAlertReference = useRef<NullableRef<HTMLDivElement>>(null);
  const [hasRequestBeenSent, setHasRequestBeenSent] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<Nullable<string>>(null);
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0);
  const [serverErrorKey, setServerErrorKey] =
    useState<Nullable<PasswordResetErrorKey>>(null);
  const form = useForm<PasswordRecoveryFormValues>({
    defaultValues: {
      ...DEFAULT_PASSWORD_RECOVERY_FORM_VALUES,
      email: readInitialEmail(location.state),
    },
    mode: "onTouched",
    resolver: zodResolver(passwordRecoveryFormSchema),
  });

  useEffect(() => {
    if (serverErrorKey) serverErrorAlertReference.current?.focus();
  }, [serverErrorKey]);

  // A reCAPTCHA token is single-use: every attempt needs a new one.
  const resetRecaptcha = (): void => {
    setRecaptchaToken(null);
    setRecaptchaResetSignal((previousSignal) => previousSignal + 1);
  };

  const handleRequestError = (passwordResetError: PasswordResetError): void => {
    setServerErrorKey(passwordResetError.messageKey);
    resetRecaptcha();
  };

  const submitPasswordRecoveryForm = (
    passwordRecoveryFormValues: PasswordRecoveryFormValues,
  ): void => {
    if (!recaptchaToken) return;

    setServerErrorKey(null);
    requestPasswordResetMutation.mutate(
      { ...passwordRecoveryFormValues, recaptchaToken },
      {
        onError: handleRequestError,
        onSuccess: () => {
          setHasRequestBeenSent(true);
          startCooldown();
          resetRecaptcha();
        },
      },
    );
  };

  const isSubmitting =
    form.formState.isSubmitting || requestPasswordResetMutation.isPending;

  return {
    form,
    handleRecaptchaTokenChange: setRecaptchaToken,
    handleSubmit: form.handleSubmit(submitPasswordRecoveryForm),
    hasRequestBeenSent,
    isSubmitDisabled: !recaptchaToken || isSubmitting || remainingSeconds > 0,
    isSubmitting,
    language: i18n.resolvedLanguage ?? DEFAULT_LANGUAGE,
    recaptchaResetSignal,
    recaptchaSiteKey,
    remainingCooldownSeconds: remainingSeconds,
    serverErrorAlertReference,
    serverErrorKey,
  };
};
