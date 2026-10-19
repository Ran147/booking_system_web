import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ARIA_ROLE } from "@/constants";

// The same message whether or not the account exists (AC-KAN-36-02).
export const PasswordRecoverySentNotice = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <p
      className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground"
      role={ARIA_ROLE.STATUS}
    >
      {t("auth.passwordReset.requestSent")}
    </p>
  );
};
