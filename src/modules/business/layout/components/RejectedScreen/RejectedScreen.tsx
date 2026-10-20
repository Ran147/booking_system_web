import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { MAILTO_PROTOCOL } from "@/modules/business/layout/constants/BusinessGateState.constants";
import type { RejectedScreenProps } from "@/modules/business/layout/models";
import { BusinessStatusScreen } from "../BusinessStatusScreen";

// AC-KAN-33-11: the super admin rejected the business. Shows the reason and
// the platform contact (D-5).
export const RejectedScreen = ({
  details,
  isSigningOut,
  onSignOut,
}: RejectedScreenProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <BusinessStatusScreen
      description={t("rejected.description")}
      isSigningOut={isSigningOut}
      onSignOut={onSignOut}
      title={t("rejected.title")}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("rejected.businessLabel")}</dt>
        <dd className="font-medium text-foreground">{details.businessName}</dd>
        {details.reason && (
          <>
            <dt className="text-muted-foreground">
              {t("rejected.reasonLabel")}
            </dt>
            <dd className="text-foreground">{details.reason}</dd>
          </>
        )}
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">
        {t("rejected.contactLabel")}{" "}
        <AppLink to={`${MAILTO_PROTOCOL}${details.contactEmail}`}>
          {details.contactEmail}
        </AppLink>
      </p>
    </BusinessStatusScreen>
  );
};
