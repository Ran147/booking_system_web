import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppLink, Button } from "@/components/common";
import { ROUTE_PATH } from "@/constants";
import type { PasswordResetLinkNoticeProps } from "../models/passwordReset.model";

// Shown instead of the form when the link cannot be used (AC-KAN-37-05), or
// when it could not be checked because of the network.
export const PasswordResetLinkNotice = ({
  onRetry,
  shouldOfferRetry,
}: PasswordResetLinkNoticeProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <Alert className="flex flex-col items-start gap-2">
      <p>
        {shouldOfferRetry
          ? t("errors.network")
          : t("auth.passwordReset.linkInvalid")}
      </p>
      {shouldOfferRetry ? (
        <Button onClick={onRetry} type="button" variant="outline">
          {t("auth.passwordReset.retryAction")}
        </Button>
      ) : (
        <AppLink to={ROUTE_PATH.AUTH.PASSWORD_RECOVERY}>
          {t("auth.passwordReset.requestNewLinkAction")}
        </AppLink>
      )}
    </Alert>
  );
};
