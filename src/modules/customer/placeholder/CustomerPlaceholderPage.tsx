import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import {
  AppLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTemplate,
} from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH, STRING } from "@/constants";

// Temporary customer portal home with direct navigation to features (my bookings).
export const CustomerPlaceholderPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const { businessSlug = STRING.EMPTY } = useParams();

  const myBookingsPath = `/${businessSlug}/${ROUTE_PATH.CUSTOMER.MY_BOOKINGS}`;

  return (
    <PageTemplate
      description={t("placeholder.description")}
      title={t("placeholder.title")}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">
              {t("myBookings.title")}
            </CardTitle>
            <CardDescription>{t("myBookings.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AppLink
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline text-sm"
              to={myBookingsPath}
            >
              <span>{t("myBookings.list.label")}</span>
              <span aria-hidden="true">→</span>
            </AppLink>
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
};
