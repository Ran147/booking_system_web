import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import type { PendingApprovalScreenProps } from "@/modules/business/layout/models";
import { BusinessStatusScreen } from "../BusinessStatusScreen";

// AC-KAN-33-09: the business paid and signed up and waits for the super
// admin. The sign-up date appears only when the business stores it; the plan
// waits for a readable source (D-4).
export const PendingApprovalScreen = ({
  details,
  isSigningOut,
  onSignOut,
}: PendingApprovalScreenProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <BusinessStatusScreen
      description={t("pendingApproval.description")}
      isSigningOut={isSigningOut}
      onSignOut={onSignOut}
      title={t("pendingApproval.title")}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">
          {t("pendingApproval.businessLabel")}
        </dt>
        <dd className="font-medium text-foreground">{details.businessName}</dd>
        {details.signedUpAtLabel && (
          <>
            <dt className="text-muted-foreground">
              {t("pendingApproval.signUpDateLabel")}
            </dt>
            <dd className="font-medium text-foreground">
              {details.signedUpAtLabel}
            </dd>
          </>
        )}
      </dl>
    </BusinessStatusScreen>
  );
};
