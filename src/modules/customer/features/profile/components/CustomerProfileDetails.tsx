import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { CustomerProfileDetailsProps } from "../models";

export const CustomerProfileDetails = ({
  profile,
}: CustomerProfileDetailsProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);

  return (
    <Card>
      <CardContent className="p-6">
        <dl className="min-w-0 space-y-6">
          <div>
            <dt className="font-medium text-muted-foreground">
              {t("profile.fields.fullName")}
            </dt>
            <dd className="mt-1 [overflow-wrap:anywhere]">
              {profile.fullName ?? t("profile.fields.notProvided")}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">
              {t("profile.fields.email")}
            </dt>
            <dd className="mt-1 [overflow-wrap:anywhere]">
              {profile.email ?? t("profile.fields.notProvided")}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">
              {t("profile.fields.phone")}
            </dt>
            <dd className="mt-1 [overflow-wrap:anywhere]">
              {profile.phone ?? t("profile.fields.notProvided")}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};
