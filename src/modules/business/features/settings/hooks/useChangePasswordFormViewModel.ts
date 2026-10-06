import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/components";
import {
  FIREBASE_ERROR_CODE,
  I18N_NAMESPACE,
  VALIDATION_MESSAGE_KEY,
  type ValidationMessageKey,
} from "@/constants";
import { PASSWORD_RULE, PASSWORD_STRENGTH } from "@/modules/auth";
import type { MutationError, Nullable, NullableUndefined } from "@/types";
import { useChangePasswordMutation } from "../api/useChangePasswordMutation";
import {
  CHANGE_PASSWORD_ERROR_KEY,
  DEFAULT_CHANGE_PASSWORD_VALUES,
} from "../constants/ChangePassword.constants";
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
  type ChangePasswordFormViewModel,
} from "../models";

const isValidationMessageKey = (
  messageKey: string,
): messageKey is ValidationMessageKey =>
  Object.values(VALIDATION_MESSAGE_KEY).some(
    (validationMessageKey) => validationMessageKey === messageKey,
  );

export const useChangePasswordFormViewModel =
  (): ChangePasswordFormViewModel => {
    const { t } = useTranslation([
      I18N_NAMESPACE.BUSINESS,
      I18N_NAMESPACE.COMMON,
    ]);
    const { t: translateValidation } = useTranslation(
      I18N_NAMESPACE.VALIDATION,
    );
    const changePasswordMutation = useChangePasswordMutation();
    const [submitErrorMessage, setSubmitErrorMessage] =
      useState<Nullable<string>>(null);
    const [visibilityResetKey, setVisibilityResetKey] = useState(0);
    const form = useForm<ChangePasswordFormValues>({
      defaultValues: DEFAULT_CHANGE_PASSWORD_VALUES,
      mode: "onBlur",
      resolver: zodResolver(changePasswordFormSchema),
    });
    const newPassword =
      useWatch({ control: form.control, name: "newPassword" }) ?? "";

    const passwordRules = [
      {
        isMet: newPassword.length >= PASSWORD_RULE.MIN_LENGTH,
        label: t("common:auth.password.rules.minimumLength", {
          count: PASSWORD_RULE.MIN_LENGTH,
        }),
      },
      {
        isMet: PASSWORD_RULE.PATTERN.LOWERCASE.test(newPassword),
        label: t("common:auth.password.rules.lowercase"),
      },
      {
        isMet: PASSWORD_RULE.PATTERN.UPPERCASE.test(newPassword),
        label: t("common:auth.password.rules.uppercase"),
      },
      {
        isMet: PASSWORD_RULE.PATTERN.DIGIT.test(newPassword),
        label: t("common:auth.password.rules.digit"),
      },
      {
        isMet: PASSWORD_RULE.PATTERN.SYMBOL.test(newPassword),
        label: t("common:auth.password.rules.symbol"),
      },
    ];
    const metRuleCount = passwordRules.filter((rule) => rule.isMet).length;
    const passwordStrengthLabel =
      metRuleCount >= PASSWORD_STRENGTH.STRONG_MINIMUM_RULES
        ? t("common:auth.password.strength.strong")
        : metRuleCount >= PASSWORD_STRENGTH.MEDIUM_MINIMUM_RULES
          ? t("common:auth.password.strength.medium")
          : t("common:auth.password.strength.weak");

    const resolveFieldErrorMessage = (
      messageKey?: string,
    ): NullableUndefined<string> => {
      if (!messageKey) return undefined;
      if (isValidationMessageKey(messageKey)) {
        return translateValidation(messageKey);
      }

      const featureMessageByKey: Readonly<Record<string, string>> = {
        [CHANGE_PASSWORD_ERROR_KEY.CONFIRMATION_MISMATCH]: t(
          "business:settings.password.confirmationMismatch",
        ),
        [CHANGE_PASSWORD_ERROR_KEY.CURRENT_PASSWORD_INVALID]: t(
          "business:settings.password.currentPasswordInvalid",
        ),
        [CHANGE_PASSWORD_ERROR_KEY.SAME_AS_CURRENT]: t(
          "business:settings.password.sameAsCurrent",
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

      setSubmitErrorMessage(
        mutationError.code === FIREBASE_ERROR_CODE.TOO_MANY_REQUESTS
          ? t("business:settings.password.tooManyAttempts")
          : t(`common:${mutationError.messageKey}`),
      );
    };

    const submitChangePassword = (
      formValues: ChangePasswordFormValues,
    ): void => {
      setSubmitErrorMessage(null);
      changePasswordMutation.mutate(
        {
          currentPassword: formValues.currentPassword,
          newPassword: formValues.newPassword,
        },
        {
          onError: handleMutationError,
          onSuccess: () => {
            toast.success(t("business:settings.password.successMessage"));
            form.reset(DEFAULT_CHANGE_PASSWORD_VALUES);
            setVisibilityResetKey((currentKey) => currentKey + 1);
          },
        },
      );
    };

    return {
      form,
      handleSubmit: form.handleSubmit(submitChangePassword),
      isSubmitting: changePasswordMutation.isPending,
      passwordRules,
      passwordStrengthLabel,
      resolveFieldErrorMessage,
      submitErrorMessage,
      visibilityResetKey,
    };
  };
