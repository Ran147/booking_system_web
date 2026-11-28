import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "@/components/common";
import {
  DEFAULT_LANGUAGE,
  ROUTE_PATH,
  SEARCH_PARAM,
  STRING,
} from "@/constants";
import { recaptchaSiteKey } from "@/services/firebase";
import type { Nullable, NullableRef } from "@/types";
import { useAcceptCollaboratorInvitationMutation } from "../api/useAcceptCollaboratorInvitationMutation";
import { useCollaboratorInvitationQuery } from "../api/useCollaboratorInvitationQuery";
import {
  ACCEPT_INVITATION_ERROR_KEY,
  ACCEPT_INVITATION_FORM_DEFAULTS,
  ACCEPT_INVITATION_LINK_STATE,
  type AcceptInvitationErrorKey,
  type AcceptInvitationLinkState,
} from "../constants/AcceptInvitation.constants";
import type { AcceptInvitationError } from "../models/AcceptInvitation.mutation";
import {
  acceptInvitationFormSchema,
  type AcceptInvitationFormValues,
} from "../models/AcceptInvitationForm.schema";
import type { AcceptInvitationViewModel } from "../models/acceptInvitation.model";

const resolveLinkState = (
  hasToken: boolean,
  isLinkMarkedInvalid: boolean,
  invitationQuery: ReturnType<typeof useCollaboratorInvitationQuery>,
): AcceptInvitationLinkState => {
  if (!hasToken || isLinkMarkedInvalid) {
    return ACCEPT_INVITATION_LINK_STATE.INVALID;
  }
  if (invitationQuery.isFetching) {
    return ACCEPT_INVITATION_LINK_STATE.CHECKING;
  }
  if (invitationQuery.isError) {
    return invitationQuery.error.messageKey ===
      ACCEPT_INVITATION_ERROR_KEY.LINK_INVALID
      ? ACCEPT_INVITATION_LINK_STATE.INVALID
      : ACCEPT_INVITATION_LINK_STATE.NETWORK_ERROR;
  }
  return invitationQuery.isSuccess
    ? ACCEPT_INVITATION_LINK_STATE.VALID
    : ACCEPT_INVITATION_LINK_STATE.CHECKING;
};

/**
 * Valida la invitacion del colaborador y activa su cuenta con contrasena nueva (KAN-79).
 * @returns {AcceptInvitationViewModel}
 */
export const useAcceptInvitationViewModel = (): AcceptInvitationViewModel => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [searchParameters] = useSearchParams();
  const invitationToken = searchParameters.get(SEARCH_PARAM.TOKEN);
  const hasToken = Boolean(invitationToken && invitationToken.trim());

  const invitationQuery = useCollaboratorInvitationQuery(
    hasToken ? invitationToken : null,
  );
  const acceptMutation = useAcceptCollaboratorInvitationMutation();
  const serverErrorAlertReference = useRef<NullableRef<HTMLDivElement>>(null);

  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [isLinkMarkedInvalid, setIsLinkMarkedInvalid] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<Nullable<string>>(null);
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0);
  const [serverErrorKey, setServerErrorKey] =
    useState<Nullable<AcceptInvitationErrorKey>>(null);

  const form = useForm<AcceptInvitationFormValues>({
    defaultValues: ACCEPT_INVITATION_FORM_DEFAULTS,
    mode: "onTouched",
    resolver: zodResolver(acceptInvitationFormSchema),
  });
  const newPassword = useWatch({ control: form.control, name: "newPassword" });

  useEffect(() => {
    if (serverErrorKey) {
      serverErrorAlertReference.current?.focus();
    }
  }, [serverErrorKey]);

  const handleAcceptError = (acceptError: AcceptInvitationError): void => {
    setRecaptchaToken(null);
    setRecaptchaResetSignal((previousSignal) => previousSignal + 1);
    if (acceptError.messageKey === ACCEPT_INVITATION_ERROR_KEY.LINK_INVALID) {
      setIsLinkMarkedInvalid(true);
      return;
    }
    setServerErrorKey(acceptError.messageKey);
  };

  const submitInvitationForm = (
    formValues: AcceptInvitationFormValues,
  ): void => {
    if (!invitationToken) {
      return;
    }
    if (Boolean(recaptchaSiteKey) && !recaptchaToken) {
      return;
    }

    flushSync(() => {
      setIsPasswordVisible(false);
      setIsConfirmationVisible(false);
    });
    setServerErrorKey(null);

    acceptMutation.mutate(
      {
        invitationToken,
        password: formValues.newPassword,
        recaptchaToken: recaptchaToken ?? STRING.EMPTY,
      },
      {
        onError: handleAcceptError,
        onSuccess: ({ email }) => {
          toast.success(t("auth.invitation.success"));
          void navigate(ROUTE_PATH.AUTH.SIGN_IN, {
            replace: true,
            state: { invitationAccepted: true, signUpEmail: email },
          });
        },
      },
    );
  };

  const isSubmitting =
    form.formState.isSubmitting || acceptMutation.isPending;
  const isSubmitDisabled =
    isSubmitting || (Boolean(recaptchaSiteKey) && !recaptchaToken);

  return {
    businessName: invitationQuery.data?.businessName ?? STRING.EMPTY,
    email: invitationQuery.data?.email ?? STRING.EMPTY,
    form,
    handleRecaptchaTokenChange: setRecaptchaToken,
    handleSubmit: form.handleSubmit(submitInvitationForm),
    handleToggleConfirmationVisibility: () =>
      setIsConfirmationVisible((wasVisible) => !wasVisible),
    handleTogglePasswordVisibility: () =>
      setIsPasswordVisible((wasVisible) => !wasVisible),
    isConfirmationVisible,
    isPasswordVisible,
    isSubmitDisabled,
    isSubmitting,
    language: i18n.resolvedLanguage ?? DEFAULT_LANGUAGE,
    linkState: resolveLinkState(hasToken, isLinkMarkedInvalid, invitationQuery),
    newPassword,
    recaptchaResetSignal,
    recaptchaSiteKey,
    retryLinkCheck: (): void => {
      void invitationQuery.refetch();
    },
    serverErrorAlertReference,
    serverErrorKey,
  };
};
