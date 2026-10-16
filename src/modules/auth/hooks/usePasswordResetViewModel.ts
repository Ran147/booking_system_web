import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "@/components/common";
import { ROUTE_PATH, SEARCH_PARAM } from "@/constants";
import type { Nullable, NullableRef } from "@/types";
import { useConfirmNewPasswordMutation } from "../api/useConfirmNewPasswordMutation";
import { useResetCodeQuery } from "../api/useResetCodeQuery";
import {
  PASSWORD_RESET_ERROR_KEY,
  type PasswordResetErrorKey,
} from "../constants/PasswordResetErrorKey.constants";
import { DEFAULT_PASSWORD_RESET_FORM_VALUES } from "../constants/PasswordResetFormDefaults.constants";
import {
  PASSWORD_RESET_LINK_STATE,
  PASSWORD_RESET_MODE,
  type PasswordResetLinkState,
} from "../constants/PasswordResetLink.constants";
import type { PasswordResetError } from "../models/PasswordReset.mutation";
import {
  passwordResetFormSchema,
  type PasswordResetFormValues,
} from "../models/PasswordResetForm.schema";
import type { PasswordResetViewModel } from "../models/passwordReset.model";

const resolveLinkState = (
  hasUsableLink: boolean,
  isLinkMarkedInvalid: boolean,
  codeQuery: ReturnType<typeof useResetCodeQuery>,
): PasswordResetLinkState => {
  if (!hasUsableLink || isLinkMarkedInvalid) {
    return PASSWORD_RESET_LINK_STATE.INVALID;
  }
  // A retry keeps isError until it answers: show the check again meanwhile.
  if (codeQuery.isFetching) return PASSWORD_RESET_LINK_STATE.CHECKING;
  if (codeQuery.isError) {
    return codeQuery.error.messageKey === PASSWORD_RESET_ERROR_KEY.LINK_INVALID
      ? PASSWORD_RESET_LINK_STATE.INVALID
      : PASSWORD_RESET_LINK_STATE.NETWORK_ERROR;
  }
  return codeQuery.isSuccess
    ? PASSWORD_RESET_LINK_STATE.VALID
    : PASSWORD_RESET_LINK_STATE.CHECKING;
};

/**
 * Comprueba el enlace del correo y guarda la contraseña nueva (US-36, KAN-37).
 * @returns {PasswordResetViewModel}
 */
export const usePasswordResetViewModel = (): PasswordResetViewModel => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParameters] = useSearchParams();
  const oobCode = searchParameters.get(SEARCH_PARAM.OOB_CODE);
  const hasUsableLink =
    Boolean(oobCode) &&
    searchParameters.get(SEARCH_PARAM.MODE) ===
      PASSWORD_RESET_MODE.RESET_PASSWORD;
  const codeQuery = useResetCodeQuery(hasUsableLink ? oobCode : null);
  const confirmNewPasswordMutation = useConfirmNewPasswordMutation();
  const serverErrorAlertReference = useRef<NullableRef<HTMLDivElement>>(null);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [isLinkMarkedInvalid, setIsLinkMarkedInvalid] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [serverErrorKey, setServerErrorKey] =
    useState<Nullable<PasswordResetErrorKey>>(null);
  const form = useForm<PasswordResetFormValues>({
    defaultValues: DEFAULT_PASSWORD_RESET_FORM_VALUES,
    mode: "onTouched",
    resolver: zodResolver(passwordResetFormSchema),
  });
  const newPassword = useWatch({ control: form.control, name: "newPassword" });

  useEffect(() => {
    if (serverErrorKey) serverErrorAlertReference.current?.focus();
  }, [serverErrorKey]);

  const handleConfirmError = (passwordResetError: PasswordResetError): void => {
    // The link expired or was used between opening the page and saving.
    if (
      passwordResetError.messageKey === PASSWORD_RESET_ERROR_KEY.LINK_INVALID
    ) {
      setIsLinkMarkedInvalid(true);
      return;
    }
    setServerErrorKey(passwordResetError.messageKey);
  };

  const submitPasswordResetForm = (
    passwordResetFormValues: PasswordResetFormValues,
  ): void => {
    if (!oobCode) return;

    // AS-1: mask both passwords in the DOM before the request leaves the page.
    flushSync(() => {
      setIsPasswordVisible(false);
      setIsConfirmationVisible(false);
    });
    setServerErrorKey(null);
    confirmNewPasswordMutation.mutate(
      { newPassword: passwordResetFormValues.newPassword, oobCode },
      {
        onError: handleConfirmError,
        onSuccess: () => {
          toast.success(t("auth.passwordReset.success"));
          void navigate(ROUTE_PATH.AUTH.SIGN_IN, { replace: true });
        },
      },
    );
  };

  return {
    form,
    handleSubmit: form.handleSubmit(submitPasswordResetForm),
    handleToggleConfirmationVisibility: () =>
      setIsConfirmationVisible((wasVisible) => !wasVisible),
    handleTogglePasswordVisibility: () =>
      setIsPasswordVisible((wasVisible) => !wasVisible),
    isConfirmationVisible,
    isPasswordVisible,
    isSubmitting:
      form.formState.isSubmitting || confirmNewPasswordMutation.isPending,
    linkState: resolveLinkState(hasUsableLink, isLinkMarkedInvalid, codeQuery),
    newPassword,
    retryLinkCheck: (): void => {
      void codeQuery.refetch();
    },
    serverErrorAlertReference,
    serverErrorKey,
  };
};
