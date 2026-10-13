import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Badge, BADGE_VARIANT } from "@/components/common";
import { PortalSidebar } from "@/components/layout";
import { I18N_NAMESPACE } from "@/constants";
import type { BusinessSidebarProps } from "./BusinessSidebar.types";

export const BusinessSidebar = ({
  activePath,
  businessName,
  className = "",
  isSubscriber,
  navItems,
  onActionClick,
  onSignOut,
}: BusinessSidebarProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <PortalSidebar
      activePath={activePath}
      ariaLabel={t("layout.sidebar.ariaLabel")}
      badge={
        <Badge className="mt-1" variant={BADGE_VARIANT.OUTLINE}>
          {isSubscriber ? t("home.roleBadge") : t("home.roleCollaboratorBadge")}
        </Badge>
      }
      brandName={businessName}
      className={className}
      navItems={navItems}
      onItemClick={onActionClick}
      onSignOut={onSignOut}
      signOutLabel={t("layout.sidebar.signOut")}
    />
  );
};
