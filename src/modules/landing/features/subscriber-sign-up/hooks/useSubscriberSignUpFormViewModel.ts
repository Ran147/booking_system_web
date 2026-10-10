import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ChangeEvent } from "react";
import { useForm, useWatch, type FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ERROR_MESSAGE_KEY, I18N_NAMESPACE, STRING } from "@/shared/constants";
import type { Nullable, NullableUndefined } from "@/shared/types";
import { isValidationMessageKey } from "@/shared/utils";
import { useBusinessSlugAvailability } from "./useBusinessSlugAvailability";
import { useCompleteSubscriberSignUpMutation } from "../api/useCompleteSubscriberSignUpMutation";
import {
  BUSINESS_SLUG_PATH_PREFIX,
  SUBSCRIBER_SIGN_UP_MESSAGE_KEY,
} from "../constants/SubscriberSignUpForm.constants";
import { DEFAULT_SUBSCRIBER_SIGN_UP_FORM_VALUES } from "../constants/SubscriberSignUpFormDefaults.constants";
import {
  BUSINESS_SLUG_AVAILABILITY,
  SIGN_UP_ERROR_REASON,
} from "../constants/SubscriberSignUpServer.constants";
import type { SignUpFunctionError } from "../models/SignUpFunctionError.interface";
import {
  subscriberSignUpFormSchema,
  type SubscriberSignUpFormValues,
} from "../models/SubscriberSignUpForm.schema";
import type {
  SignUpSubmitError,
  SubscriberSignUpFieldErrors,
  SubscriberSignUpFormProps,
  SubscriberSignUpFormViewModel,
} from "../models/SubscriberSignUpFormViewModel.interface";
import { buildCompleteSubscriberSignUpPayload } from "../utils/buildCompleteSubscriberSignUpPayload";
import { isSubscriberSignUpMessageKey } from "../utils/isSubscriberSignUpMessageKey";
import { suggestBusinessSlug } from "../utils/suggestBusinessSlug";

export const useSubscriberSignUpFormViewModel = ({
  checkoutEmail,
  onSignUpComplete,
  signUpToken,
}: SubscriberSignUpFormProps): SubscriberSignUpFormViewModel => {
  const { i18n, t } = useTranslation([
    I18N_NAMESPACE.LANDING,
    I18N_NAMESPACE.VALIDATION,
    I18N_NAMESPACE.COMMON,
  ]);
  const form = useForm<SubscriberSignUpFormValues>({
    defaultValues: {
      ...DEFAULT_SUBSCRIBER_SIGN_UP_FORM_VALUES,
      email: checkoutEmail,
    },
    mode: "onBlur",
    resolver: zodResolver(subscriberSignUpFormSchema),
  });
  const { errors, isSubmitting } = form.formState;
  const [password, businessSlug] = useWatch({
    control: form.control,
    name: ["password", "businessSlug"],
  });
  const { availability, isChecking } = useBusinessSlugAvailability(
    signUpToken,
    businessSlug,
  );
  const completeSignUpMutation = useCompleteSubscriberSignUpMutation();
  const [submitError, setSubmitError] =
    useState<Nullable<SignUpSubmitError>>(null);

  // Schemas store message keys; validation keys live in their own namespace,
  // the rest are feature keys under landing:subscriberSignUp.
  const translateFieldError = (
    fieldError: NullableUndefined<FieldError>,
  ): NullableUndefined<string> => {
    const messageKey = fieldError?.message;
    if (!messageKey) return undefined;
    if (isValidationMessageKey(messageKey))
      return t(`validation:${messageKey}`);
    if (isSubscriberSignUpMessageKey(messageKey)) {
      return t(`landing:${messageKey}`);
    }
    return undefined;
  };

  // A taken slug found while typing shows like the server's answer on submit
  // (AC-KAN-25-18).
  const translateBusinessSlugError = (): NullableUndefined<string> => {
    const businessSlugError = translateFieldError(errors.businessSlug);
    if (businessSlugError) return businessSlugError;
    if (availability === BUSINESS_SLUG_AVAILABILITY.TAKEN) {
      return t(`landing:${SUBSCRIBER_SIGN_UP_MESSAGE_KEY.SLUG_TAKEN}`);
    }
    if (availability === BUSINESS_SLUG_AVAILABILITY.RESERVED) {
      return t(`landing:${SUBSCRIBER_SIGN_UP_MESSAGE_KEY.SLUG_RESERVED}`);
    }
    return undefined;
  };

  const readBusinessSlugHelperText = (): string => {
    const businessAddress = `${BUSINESS_SLUG_PATH_PREFIX}${businessSlug}`;
    const readSlugStatus = (): NullableUndefined<string> => {
      if (isChecking) return t("landing:subscriberSignUp.form.slugChecking");
      if (availability === BUSINESS_SLUG_AVAILABILITY.AVAILABLE) {
        return t("landing:subscriberSignUp.form.slugAvailable");
      }
      return undefined;
    };
    const slugStatus = readSlugStatus();

    return slugStatus
      ? t("landing:subscriberSignUp.form.businessSlugHintWithStatus", {
          businessAddress,
          slugStatus,
        })
      : t("landing:subscriberSignUp.form.businessSlugHint", {
          businessAddress,
        });
  };

  // The slug follows the business name until the visitor edits it.
  const handleBusinessNameChange = (
    changeEvent: ChangeEvent<HTMLInputElement>,
  ): void => {
    if (form.getFieldState("businessSlug").isDirty) return;
    form.setValue(
      "businessSlug",
      suggestBusinessSlug(changeEvent.target.value),
      { shouldValidate: form.formState.isSubmitted },
    );
  };

  // Each server answer goes where the visitor can fix it: the slug field, or
  // a message above the submit button (SPEC "Server functions").
  const handleSignUpError = (
    signUpFunctionError: SignUpFunctionError,
  ): void => {
    switch (signUpFunctionError.reason) {
      case SIGN_UP_ERROR_REASON.SLUG_TAKEN:
        form.setError(
          "businessSlug",
          { message: SUBSCRIBER_SIGN_UP_MESSAGE_KEY.SLUG_TAKEN },
          { shouldFocus: true },
        );
        return;
      case SIGN_UP_ERROR_REASON.SLUG_RESERVED:
        form.setError(
          "businessSlug",
          { message: SUBSCRIBER_SIGN_UP_MESSAGE_KEY.SLUG_RESERVED },
          { shouldFocus: true },
        );
        return;
      case SIGN_UP_ERROR_REASON.ACCOUNT_EXISTS:
        setSubmitError({
          message: t("landing:subscriberSignUp.form.cannotCreateAccount"),
          showAccountLinks: true,
        });
        return;
      case SIGN_UP_ERROR_REASON.LINK_EXPIRED:
        setSubmitError({
          message: t("landing:subscriberSignUp.link.expired"),
          showAccountLinks: false,
        });
        return;
      case SIGN_UP_ERROR_REASON.LINK_INVALID:
        setSubmitError({
          message: t("landing:subscriberSignUp.link.invalid"),
          showAccountLinks: false,
        });
        return;
      default:
        break;
    }
    // The other values are kept; the passwords are typed again (AC-KAN-25-10).
    if (signUpFunctionError.messageKey === ERROR_MESSAGE_KEY.NETWORK) {
      form.setValue("password", STRING.EMPTY);
      form.setValue("passwordConfirmation", STRING.EMPTY);
    }
    setSubmitError({
      message: t(`common:${signUpFunctionError.messageKey}`),
      showAccountLinks: false,
    });
  };

  const submitSignUp = (formValues: SubscriberSignUpFormValues): void => {
    setSubmitError(null);
    completeSignUpMutation.mutate(
      buildCompleteSubscriberSignUpPayload(formValues, {
        activeLanguage: i18n.language,
        signUpToken,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
      {
        onError: handleSignUpError,
        onSuccess: (completeSignUpResponse) => {
          onSignUpComplete(completeSignUpResponse.email);
        },
      },
    );
  };

  const fieldErrors: SubscriberSignUpFieldErrors = {
    businessName: translateFieldError(errors.businessName),
    businessSlug: translateBusinessSlugError(),
    email: translateFieldError(errors.email),
    firstName: translateFieldError(errors.firstName),
    lastName: translateFieldError(errors.lastName),
    password: translateFieldError(errors.password),
    passwordConfirmation: translateFieldError(errors.passwordConfirmation),
    phone: translateFieldError(errors.phone),
  };

  return {
    businessSlugHelperText: readBusinessSlugHelperText(),
    fieldErrors,
    fields: {
      businessName: form.register("businessName", {
        onChange: handleBusinessNameChange,
      }),
      businessSlug: form.register("businessSlug"),
      email: form.register("email"),
      firstName: form.register("firstName"),
      lastName: form.register("lastName"),
      password: form.register("password"),
      passwordConfirmation: form.register("passwordConfirmation"),
      phone: form.register("phone"),
    },
    handleSubmit: form.handleSubmit(submitSignUp),
    // Disabled until the server answers, so a double click creates one
    // account (AC-KAN-25-13).
    isSubmitting: isSubmitting || completeSignUpMutation.isPending,
    password,
    submitError,
  };
};
