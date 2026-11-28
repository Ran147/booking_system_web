import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppLink, Button } from "@/components/common";
import { ROUTE_PATH } from "@/constants";
import type { AcceptInvitationLinkNoticeProps } from "../models/acceptInvitation.model";

export const AcceptInvitationLinkNotice = ({
  onRetry,
  shouldOfferRetry,
}: AcceptInvitationLinkNoticeProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <Alert className="flex flex-col items-start gap-2">
      <p>
        {shouldOfferRetry
          ? t("errors.network")
          : t("auth.invitation.linkInvalid")}
      </p>
      {shouldOfferRetry ? (
        <Button onClick={onRetry} type="button" variant="outline">
          {t("auth.passwordReset.retryAction")}
        </Button>
      ) : (
        <AppLink to={ROUTE_PATH.AUTH.SIGN_IN}>
          {t("auth.invitation.signInAction")}
        </AppLink>
      )}
    </Alert>
  );
};
