import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink, Image } from "@/components";
import { I18N_NAMESPACE } from "@/constants";
import { useCustomerNavbarViewModel } from "@/modules/customer/layout/hooks/useCustomerNavbarViewModel";
import type { CustomerNavbarProps } from "@/modules/customer/layout/models";

export const CustomerNavbar = ({
  business = null,
}: CustomerNavbarProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const { businessHomePath, businessName, handleLogoError, logoUrl } =
    useCustomerNavbarViewModel(business);

  return (
    <header className="border-b border-border bg-background">
      <nav
        aria-label={t("layout.navbar.landmarkLabel")}
        className="mx-auto flex min-h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8"
      >
        {businessHomePath && businessName ? (
          <AppLink
            aria-label={t("layout.navbar.businessHomeLabel", {
              businessName,
            })}
            className="flex min-w-0 max-w-full items-center gap-3 text-foreground no-underline hover:no-underline"
            to={businessHomePath}
          >
            {logoUrl ? (
              <Image
                alt={businessName}
                className="size-10 shrink-0 rounded-full border border-border bg-card object-cover"
                onError={handleLogoError}
                src={logoUrl}
              />
            ) : null}
            <span className="truncate text-base font-semibold sm:text-lg">
              {businessName}
            </span>
          </AppLink>
        ) : (
          <p className="text-base font-semibold sm:text-lg">
            {t("layout.title")}
          </p>
        )}
      </nav>
    </header>
  );
};
