import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "@/components/common";
import { DEFAULT_LANGUAGE, ROUTE_PATH, SEARCH_PARAM } from "@/constants";
import { recaptchaSiteKey } from "@/services/firebase";
import type { Nullable, NullableRef } from "@/types";
import {
  useAcceptInvitationMutation,
  useValidateInvitationQuery,
} from "../api/invitationApi";
import {
  DEFAULT_ACCEPT_INVITATION_FORM_VALUES,
  INVITATION_ERROR_KEY,
  INVITATION_LINK_STATE,
  type InvitationErrorKey,
  type InvitationLinkState,
} from "../constants/InvitationLink.constants";
import {
  acceptInvitationFormSchema,
  type AcceptInvitationFormValues,
} from "../models/AcceptInvitationForm.schema";
import type {
  AcceptInvitationError,
  AcceptInvitationViewModel,
} from "../models/acceptInvitation.model";

const resolveLinkState = (
  hasToken: boolean,
  isLinkMarkedInvalid: boolean,
  validationQuery: ReturnType<typeof useValidateInvitationQuery>,
): InvitationLinkState => {
  if (!hasToken || isLinkMarkedInvalid) {
    return INVITATION_LINK_STATE.INVALID;
  }
  if (validationQuery.isFetching) {
    return INVITATION_LINK_STATE.CHECKING;
  }
  if (validationQuery.isError) {
    return validationQuery.error.messageKey ===
      INVITATION_ERROR_KEY.LINK_INVALID
      ? INVITATION_LINK_STATE.INVALID
      : INVITATION_LINK_STATE.NETWORK_ERROR;
  }
  return validationQuery.isSuccess
    ? INVITATION_LINK_STATE.VALID
    : INVITATION_LINK_STATE.CHECKING;
};

/**
 * ViewModel para aceptar la invitacion de colaborador y definir su contraseña (KAN-79).
 * @returns {AcceptInvitationViewModel}
 */
export const useAcceptInvitationViewModel = (): AcceptInvitationViewModel => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [searchParameters] = useSearchParams();
  const invitationToken = searchParameters.get(SEARCH_PARAM.TOKEN);
  const validationQuery = useValidateInvitationQuery(invitationToken);
  const acceptMutation = useAcceptInvitationMutation();
  const serverErrorAlertReference = useRef<NullableRef<HTMLDivElement>>(null);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [isLinkMarkedInvalid, setIsLinkMarkedInvalid] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<Nullable<string>>(null);
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0);
  const [serverErrorKey, setServerErrorKey] =
    useState<Nullable<InvitationErrorKey>>(null);

  const form = useForm<AcceptInvitationFormValues>({
    defaultValues: DEFAULT_ACCEPT_INVITATION_FORM_VALUES,
    mode: "onTouched",
    resolver: zodResolver(acceptInvitationFormSchema),
  });
  const newPassword = useWatch({ control: form.control, name: "newPassword" });

  useEffect(() => {
    if (serverErrorKey) {
      serverErrorAlertReference.current?.focus();
    }
  }, [serverErrorKey]);

  const handleAcceptError = (error: AcceptInvitationError): void => {
    setRecaptchaToken(null);
    setRecaptchaResetSignal((signal) => signal + 1);

    if (error.messageKey === INVITATION_ERROR_KEY.LINK_INVALID) {
      setIsLinkMarkedInvalid(true);
      return;
    }
    setServerErrorKey(error.messageKey);
  };

  const submitForm = async (
    values: AcceptInvitationFormValues,
  ): Promise<void> => {
    if (!invitationToken || !recaptchaToken) {
      return;
    }

    flushSync(() => {
      setIsPasswordVisible(false);
      setIsConfirmationVisible(false);
    });
    setServerErrorKey(null);

    try {
      const result = await acceptMutation.mutateAsync({
        invitationToken,
        password: values.newPassword,
        recaptchaToken,
      });
      toast.success(t("auth.invitation.success"));
      void navigate(ROUTE_PATH.AUTH.SIGN_IN, {
        replace: true,
        state: { prefilledEmail: result.email },
      });
    } catch (error) {
      handleAcceptError(error as AcceptInvitationError);
    }
  };

  return {
    businessName: validationQuery.data?.businessName ?? "",
    email: validationQuery.data?.email ?? "",
    form,
    handleRecaptchaTokenChange: setRecaptchaToken,
    handleSubmit: form.handleSubmit(submitForm),
    handleToggleConfirmationVisibility: (): void => {
      setIsConfirmationVisible((visible) => !visible);
    },
    handleTogglePasswordVisibility: (): void => {
      setIsPasswordVisible((visible) => !visible);
    },
    isConfirmationVisible,
    isPasswordVisible,
    isSubmitDisabled: !recaptchaToken || acceptMutation.isPending,
    isSubmitting: acceptMutation.isPending,
    language: i18n.language === DEFAULT_LANGUAGE ? DEFAULT_LANGUAGE : "en",
    linkState: resolveLinkState(
      Boolean(invitationToken),
      isLinkMarkedInvalid,
      validationQuery,
    ),
    newPassword,
    recaptchaResetSignal,
    recaptchaSiteKey,
    retryLinkCheck: (): void => {
      void validationQuery.refetch();
    },
    serverErrorAlertReference,
    serverErrorKey,
  };
};
