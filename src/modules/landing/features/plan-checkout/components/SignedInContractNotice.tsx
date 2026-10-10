import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components";
import { ARIA_ROLE, I18N_NAMESPACE } from "@/shared/constants";

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
    <div
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground"
      role={ARIA_ROLE.ALERT}
    >
      <p>{t("planCheckout.detail.signedInNotice")}</p>
      <Button isLoading={isSigningOut} onClick={onSignOut} variant="outline">
        {t("planCheckout.detail.signOutAction")}
      </Button>
    </div>
  );
};
