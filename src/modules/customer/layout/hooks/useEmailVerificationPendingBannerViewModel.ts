import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { ALERT_VARIANT } from "@/components/common";
import { DEFAULT_LANGUAGE, I18N_NAMESPACE } from "@/constants";
import { USER_ROLE } from "@/domain";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import { auth } from "@/services/firebase";
import type { Nullable } from "@/types";
import { useResendVerificationEmailMutation } from "../api/useResendVerificationEmailMutation";
import {
  RESEND_VERIFICATION_MESSAGE_KEY,
  type ResendVerificationMessageKey,
} from "../constants/EmailVerificationBanner.constants";
import type {
  EmailVerificationPendingBannerViewModel,
  ResendVerificationFeedback,
} from "../models";

// The roles the customer portal admits (customer.routes.tsx).
const CUSTOMER_PORTAL_ROLES: readonly string[] = [
  USER_ROLE.CLIENT,
  USER_ROLE.CUSTOMER,
];

const toAlertVariant = (
  messageKey: ResendVerificationMessageKey,
): ResendVerificationFeedback["variant"] => {
  if (messageKey === RESEND_VERIFICATION_MESSAGE_KEY.SENT) {
    return ALERT_VARIANT.SUCCESS;
  }
  return messageKey === RESEND_VERIFICATION_MESSAGE_KEY.TOO_MANY_REQUESTS
    ? ALERT_VARIANT.WARNING
    : ALERT_VARIANT.DESTRUCTIVE;
};

/**
 * Un cliente con el correo sin verificar puede entrar (AS-7) y ve el aviso
 * con "Reenviar correo" (AC-KAN-126-04 … 06).
 * @returns {EmailVerificationPendingBannerViewModel}
 */
export const useEmailVerificationPendingBannerViewModel =
  (): EmailVerificationPendingBannerViewModel => {
    const { i18n, t } = useTranslation([
      I18N_NAMESPACE.CUSTOMER,
      I18N_NAMESPACE.COMMON,
    ]);
    const session = useSession();
    const { businessSlug = "" } = useParams<{ businessSlug: string }>();
    const resendMutation = useResendVerificationEmailMutation();
    const [resendMessageKey, setResendMessageKey] =
      useState<Nullable<ResendVerificationMessageKey>>(null);

    const isCustomerSession =
      session.status === SESSION_STATUS.SIGNED_IN &&
      CUSTOMER_PORTAL_ROLES.includes(session.role);

    const handleResend = (): void => {
      setResendMessageKey(null);
      resendMutation.mutate(
        {
          continueUrl: `${window.location.origin}/${businessSlug}`,
          language: i18n.resolvedLanguage ?? DEFAULT_LANGUAGE,
        },
        {
          onError: setResendMessageKey,
          onSuccess: () => {
            setResendMessageKey(RESEND_VERIFICATION_MESSAGE_KEY.SENT);
          },
        },
      );
    };

    return {
      handleResend,
      isResending: resendMutation.isPending,
      isVisible: isCustomerSession && auth.currentUser?.emailVerified === false,
      resendFeedback: resendMessageKey
        ? {
            message: t(resendMessageKey),
            variant: toAlertVariant(resendMessageKey),
          }
        : null,
    };
  };
