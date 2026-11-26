import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { useEmailVerificationPendingBannerViewModel } from "@/modules/customer/layout/hooks/useEmailVerificationPendingBannerViewModel";
import type { Nullable } from "@/types";

export const EmailVerificationPendingBanner = (): Nullable<ReactElement> => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const { handleResend, isResending, isVisible, resendFeedback } =
    useEmailVerificationPendingBannerViewModel();

  if (!isVisible) return null;

  return (
    <div className="flex w-full flex-col gap-2 pb-6">
      <Alert
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        variant={ALERT_VARIANT.WARNING}
      >
        <span>{t("signUp.verification.pending")}</span>
        <Button
          isLoading={isResending}
          onClick={handleResend}
          size={BUTTON_SIZE.SM}
          type="button"
          variant={BUTTON_VARIANT.OUTLINE}
        >
          {t("signUp.verification.resendAction")}
        </Button>
      </Alert>
      {resendFeedback && (
        <Alert variant={resendFeedback.variant}>{resendFeedback.message}</Alert>
      )}
    </div>
  );
};
