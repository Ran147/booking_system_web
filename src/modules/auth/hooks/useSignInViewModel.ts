import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { DEFAULT_LANGUAGE } from "@/constants";
import { recaptchaSiteKey } from "@/services/firebase";
import type { Nullable, NullableRef } from "@/types";
import { useRedirectAfterSignIn } from "./useRedirectAfterSignIn";
import { useSignInMutation } from "../api/useSignInMutation";
import {
  SIGN_IN_ERROR_KEY,
  type SignInErrorKey,
} from "../constants/SignInErrorKey.constants";
import { DEFAULT_SIGN_IN_FORM_VALUES } from "../constants/SignInFormDefaults.constants";
import type { SignInError } from "../models/SignIn.mutation";
import {
  signInFormSchema,
  type SignInFormValues,
} from "../models/SignInForm.schema";
import type { SignInViewModel } from "../models/signIn.model";
import { readSignUpEmail } from "../utils/readSignUpEmail";
import { toLocationWithoutState } from "../utils/toLocationWithoutState";

/**
 * Estado, envío, errores y navegación del inicio de sesión (US-33).
 * @returns {SignInViewModel}
 */
export const useSignInViewModel = (): SignInViewModel => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const resolveSignInDestination = useRedirectAfterSignIn();
  const signInMutation = useSignInMutation();
  const serverErrorAlertReference = useRef<NullableRef<HTMLDivElement>>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<Nullable<string>>(null);
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0);
  const [serverErrorKey, setServerErrorKey] =
    useState<Nullable<SignInErrorKey>>(null);
  // Read once: the email of a sign-up that just finished (AC-KAN-27-01).
  const [signUpEmail] = useState(() => readSignUpEmail(location.state));
  const form = useForm<SignInFormValues>({
    defaultValues: {
      ...DEFAULT_SIGN_IN_FORM_VALUES,
      email: signUpEmail ?? DEFAULT_SIGN_IN_FORM_VALUES.email,
    },
    // First check on blur, then on every change (AC-KAN-34-01).
    mode: "onTouched",
    resolver: zodResolver(signInFormSchema),
  });

  // The sign-up state is dropped from history, so a reload or a later visit
  // does not show the success message again (AC-KAN-27-01, "once").
  const hasSignUpState = readSignUpEmail(location.state) !== null;
  useEffect(() => {
    if (!hasSignUpState) return;
    void navigate(toLocationWithoutState(location), {
      replace: true,
      state: null,
    });
  }, [hasSignUpState, location, navigate]);

  // AC-KAN-34-07: the message is announced (role="alert") and gets focus.
  useEffect(() => {
    if (serverErrorKey) serverErrorAlertReference.current?.focus();
  }, [serverErrorKey]);

  // A reCAPTCHA token is single-use: every failed attempt needs a new one.
  const handleSignInError = (signInError: SignInError): void => {
    setServerErrorKey(signInError.messageKey);
    form.resetField("password");
    setRecaptchaToken(null);
    setRecaptchaResetSignal((previousSignal) => previousSignal + 1);
  };

  const submitSignInForm = (signInFormValues: SignInFormValues): void => {
    if (!recaptchaToken) return;

    // AS-1: mask the password in the DOM before the request leaves the page.
    flushSync(() => setIsPasswordVisible(false));
    setServerErrorKey(null);
    signInMutation.mutate(
      { ...signInFormValues, recaptchaToken },
      {
        onError: handleSignInError,
        onSuccess: ({ session }) => {
          void navigate(resolveSignInDestination(session.role), {
            replace: true,
          });
        },
      },
    );
  };

  const emailValue = useWatch({ control: form.control, name: "email" });
  const isSubmitting = form.formState.isSubmitting || signInMutation.isPending;

  return {
    form,
    handleRecaptchaTokenChange: setRecaptchaToken,
    handleSubmit: form.handleSubmit(submitSignInForm),
    handleTogglePasswordVisibility: () =>
      setIsPasswordVisible((wasVisible) => !wasVisible),
    isPasswordVisible,
    isSubmitDisabled: !recaptchaToken || isSubmitting,
    isSubmitting,
    language: i18n.resolvedLanguage ?? DEFAULT_LANGUAGE,
    // AC-KAN-36-01: the recovery page starts with the email typed here.
    passwordRecoveryLocationState: { email: emailValue },
    recaptchaResetSignal,
    recaptchaSiteKey,
    serverErrorAlertReference,
    serverErrorKey,
    shouldShowPasswordRecoveryLink:
      serverErrorKey === SIGN_IN_ERROR_KEY.TOO_MANY_ATTEMPTS,
    shouldShowSignUpSuccess: signUpEmail !== null && serverErrorKey === null,
  };
};
