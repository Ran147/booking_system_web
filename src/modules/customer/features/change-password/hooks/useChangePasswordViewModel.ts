import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/common";
import {
  FIREBASE_ERROR_CODE,
  I18N_NAMESPACE,
  STRING,
  VALIDATION_MESSAGE_KEY,
  type ValidationMessageKey,
} from "@/constants";
import {
  CHANGE_PASSWORD_ERROR_CODE,
  CHANGE_PASSWORD_ERROR_KEY,
  DEFAULT_CHANGE_PASSWORD_VALUES,
} from "@/modules/auth";
import type { MutationError, NullableRef, NullableUndefined } from "@/types";
import { useChangePasswordMutation } from "../api";
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
  type ChangePasswordViewModel,
} from "../models";

const isValidationMessageKey = (
  messageKey: string,
): messageKey is ValidationMessageKey =>
  Object.values(VALIDATION_MESSAGE_KEY).some(
    (validationMessageKey) => validationMessageKey === messageKey,
  );

export const useChangePasswordViewModel = (): ChangePasswordViewModel => {
  const { t } = useTranslation([
    I18N_NAMESPACE.COMMON,
    I18N_NAMESPACE.CUSTOMER,
  ]);
  const { t: translateValidation } = useTranslation(I18N_NAMESPACE.VALIDATION);
  const mutation = useChangePasswordMutation();
  const [submitErrorMessage, setSubmitErrorMessage] =
    useState<NullableRef<string>>(null);
  const [visibilityResetKey, setVisibilityResetKey] = useState(0);
  const form = useForm<ChangePasswordFormValues>({
    defaultValues: DEFAULT_CHANGE_PASSWORD_VALUES,
    mode: "onBlur",
    resolver: zodResolver(changePasswordFormSchema),
  });
  const newPassword =
    useWatch({ control: form.control, name: "newPassword" }) ?? STRING.EMPTY;

  const resolveFieldErrorMessage = (
    messageKey?: string,
  ): NullableUndefined<string> => {
    if (!messageKey) return undefined;
    if (isValidationMessageKey(messageKey)) {
      return translateValidation(messageKey);
    }

    const featureMessageByKey: Readonly<Record<string, string>> = {
      [CHANGE_PASSWORD_ERROR_KEY.CONFIRMATION_MISMATCH]: t(
        "customer:profile.password.mismatchError",
      ),
      [CHANGE_PASSWORD_ERROR_KEY.CURRENT_PASSWORD_INVALID]: t(
        "customer:profile.password.currentInvalidError",
      ),
      [CHANGE_PASSWORD_ERROR_KEY.SAME_AS_CURRENT]: t(
        "customer:profile.password.sameAsCurrentError",
      ),
    };

    return featureMessageByKey[messageKey];
  };

  const handleMutationError = (mutationError: MutationError): void => {
    if (
      mutationError.code === FIREBASE_ERROR_CODE.INVALID_CREDENTIAL ||
      mutationError.code === FIREBASE_ERROR_CODE.WRONG_PASSWORD
    ) {
      form.setError("currentPassword", {
        message: CHANGE_PASSWORD_ERROR_KEY.CURRENT_PASSWORD_INVALID,
      });
      return;
    }

    if (mutationError.code === FIREBASE_ERROR_CODE.WEAK_PASSWORD) {
      form.setError("newPassword", {
        message: VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK,
      });
      return;
    }

    if (
      mutationError.code ===
        CHANGE_PASSWORD_ERROR_CODE.AUTHENTICATED_USER_REQUIRED ||
      mutationError.code === FIREBASE_ERROR_CODE.INVALID_USER_TOKEN ||
      mutationError.code === FIREBASE_ERROR_CODE.REQUIRES_RECENT_LOGIN ||
      mutationError.code === FIREBASE_ERROR_CODE.USER_MISMATCH ||
      mutationError.code === FIREBASE_ERROR_CODE.USER_TOKEN_EXPIRED
    ) {
      setSubmitErrorMessage(
        t("customer:profile.password.reauthenticationError"),
      );
      return;
    }

    setSubmitErrorMessage(
      mutationError.code === FIREBASE_ERROR_CODE.TOO_MANY_REQUESTS
        ? t("customer:profile.password.tooManyAttemptsError")
        : t(`common:${mutationError.messageKey}`),
    );
  };

  const submitPasswordChange = (values: ChangePasswordFormValues): void => {
    setSubmitErrorMessage(null);
    mutation.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onError: handleMutationError,
        onSuccess: () => {
          form.reset(DEFAULT_CHANGE_PASSWORD_VALUES);
          setVisibilityResetKey((currentKey) => currentKey + 1);
          toast.success(t("customer:profile.password.changeSuccess"));
        },
      },
    );
  };

  return {
    form,
    handleSubmit: form.handleSubmit(submitPasswordChange),
    isSubmitting: mutation.isPending,
    newPassword,
    resolveFieldErrorMessage,
    submitErrorMessage,
    visibilityResetKey,
  };
};
