import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ALERT_VARIANT, Button } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";

export interface SignedInContractNoticeProps {
  readonly isSigningOut: boolean;
  readonly onSignOut: () => void;
}

// A new business is contracted signed out (AC-KAN-21-11, AS-8).
export const SignedInContractNotice = ({
  isSigningOut,
  onSignOut,
}: SignedInContractNoticeProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <Alert className="flex flex-col gap-3" variant={ALERT_VARIANT.WARNING}>
      <p>{t("planCheckout.detail.signedInNotice")}</p>
      <Button isLoading={isSigningOut} onClick={onSignOut} variant="outline">
        {t("planCheckout.detail.signOutAction")}
      </Button>
    </Alert>
  );
};
