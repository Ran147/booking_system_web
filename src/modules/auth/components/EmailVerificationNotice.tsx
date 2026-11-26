import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppLink, Button, Spinner } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { EMAIL_VERIFICATION_STATE } from "../constants/AuthAction.constants";
import type { EmailVerificationNoticeProps } from "../models/emailVerification.model";

// Result of opening the verification link (AC-KAN-126-02, AC-KAN-126-03).
// Verified or invalid both lead to sign-in: an unverified customer asks for a
// new email from their session (spec D3).
export const EmailVerificationNotice = ({
  emailVerificationViewModel,
}: EmailVerificationNoticeProps): ReactElement => {
  // errorKey carries its namespace (common:errors.*), like US-36.
  const { t } = useTranslation([I18N_NAMESPACE.COMMON]);
  const { errorKey, retryVerification, signInPath, verificationState } =
    emailVerificationViewModel;

  if (verificationState === EMAIL_VERIFICATION_STATE.CHECKING) {
    return <Spinner />;
  }

  if (verificationState === EMAIL_VERIFICATION_STATE.FAILED && errorKey) {
    return (
      <Alert className="flex flex-col items-start gap-2">
        <p>{t(errorKey)}</p>
        <Button onClick={retryVerification} type="button" variant="outline">
          {t("auth.emailVerification.retryAction")}
        </Button>
      </Alert>
    );
  }

  const isVerified = verificationState === EMAIL_VERIFICATION_STATE.VERIFIED;

  return (
    <div className="flex flex-col items-start gap-4">
      {isVerified ? (
        <p className="text-foreground" role="status">
          {t("auth.emailVerification.success")}
        </p>
      ) : (
        <Alert>{t("auth.emailVerification.linkInvalid")}</Alert>
      )}
      <AppLink to={signInPath}>
        {t("auth.emailVerification.signInAction")}
      </AppLink>
    </div>
  );
};
