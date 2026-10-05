import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/common";
import { I18N_NAMESPACE, VALIDATION_MESSAGE_KEY } from "@/constants";
import { useChangePasswordMutation } from "../api";
import {
  CHANGE_PASSWORD_ERROR_CODE,
  CHANGE_PASSWORD_MESSAGE_KEY,
} from "../constants";
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
  type ChangePasswordViewModel,
} from "../models";

const DEFAULT_VALUES: ChangePasswordFormValues = {
  confirmation: "",
  currentPassword: "",
  newPassword: "",
};

export const useChangePasswordViewModel = (): ChangePasswordViewModel => {
  const { t } = useTranslation([
    I18N_NAMESPACE.COMMON,
    I18N_NAMESPACE.CUSTOMER,
  ]);
  const mutation = useChangePasswordMutation();
  const [isPasswordVisible, setIsPasswordVisible] = useState<
    Record<keyof ChangePasswordFormValues, boolean>
  >({
    confirmation: false,
    currentPassword: false,
    newPassword: false,
  });
  const form = useForm<ChangePasswordFormValues>({
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
    resolver: zodResolver(
      changePasswordFormSchema,
    ) as Resolver<ChangePasswordFormValues>,
  });

  const submitPasswordChange = (values: ChangePasswordFormValues): void => {
    mutation.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onError: (error) => {
          if (error.code === CHANGE_PASSWORD_ERROR_CODE.CURRENT_INVALID) {
            form.setError("currentPassword", {
              message: CHANGE_PASSWORD_MESSAGE_KEY.CURRENT_INVALID,
              type: "server",
            });
            return;
          }
          if (error.code === CHANGE_PASSWORD_ERROR_CODE.WEAK_PASSWORD) {
            form.setError("newPassword", {
              message: VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK,
              type: "server",
            });
            return;
          }
          if (error.code === CHANGE_PASSWORD_ERROR_CODE.NETWORK) {
            toast.error(t("common:errors.network"));
            return;
          }
          if (error.code === CHANGE_PASSWORD_ERROR_CODE.TOO_MANY_ATTEMPTS) {
            toast.error(t("customer:profile.password.tooManyAttemptsError"));
            return;
          }
          if (
            error.code === CHANGE_PASSWORD_ERROR_CODE.REAUTHENTICATION_INVALID
          ) {
            toast.error(t("customer:profile.password.reauthenticationError"));
            return;
          }
          toast.error(t("common:errors.unknown"));
        },
        onSuccess: () => {
          form.reset(DEFAULT_VALUES);
          setIsPasswordVisible({
            confirmation: false,
            currentPassword: false,
            newPassword: false,
          });
          toast.success(t("customer:profile.password.changeSuccess"));
        },
      },
    );
  };

  return {
    canSubmit: form.formState.isValid && !mutation.isPending,
    form,
    handleSubmit: form.handleSubmit(submitPasswordChange),
    handleToggleVisibility: (fieldName) =>
      setIsPasswordVisible((currentVisibility) => ({
        ...currentVisibility,
        [fieldName]: !currentVisibility[fieldName],
      })),
    isPasswordVisible,
    isSubmitting: mutation.isPending,
  };
};
