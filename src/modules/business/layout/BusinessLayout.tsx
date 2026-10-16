import { Menu } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Drawer,
  DRAWER_POSITION,
} from "@/components/common";
import { PlaceholderDialog } from "@/components/common/portal-home-template/components";
import { I18N_NAMESPACE } from "@/constants";
import { BusinessSidebar } from "./components";
import { useBusinessSidebarViewModel } from "./hooks";
import { useBusinessLanguageSync } from "../features/settings/hooks/useBusinessLanguageSync";

export const BusinessLayout = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const location = useLocation();
  const viewModel = useBusinessSidebarViewModel();
  useBusinessLanguageSync();

  const placeholderQuickAccessItem = viewModel.activePlaceholderItem
    ? {
        actionLabel: "",
        description: viewModel.activePlaceholderItem.description ?? "",
        icon: viewModel.activePlaceholderItem.icon,
        id: viewModel.activePlaceholderItem.id,
        isAvailable: viewModel.activePlaceholderItem.isAvailable,
        title: viewModel.activePlaceholderItem.label,
      }
    : null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <BusinessSidebar
          activePath={location.pathname}
          businessName={viewModel.businessName}
          isCollaborator={viewModel.isCollaborator}
          isSubscriber={viewModel.isSubscriber}
          navItems={viewModel.navItems}
          onActionClick={viewModel.handleActionClick}
          onSignOut={viewModel.handleSignOut}
        />
      </div>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={viewModel.isDrawerOpen}
        onClose={viewModel.closeDrawer}
        position={DRAWER_POSITION.LEFT}
      >
        <BusinessSidebar
          activePath={location.pathname}
          businessName={viewModel.businessName}
          isCollaborator={viewModel.isCollaborator}
          isSubscriber={viewModel.isSubscriber}
          navItems={viewModel.navItems}
          onActionClick={viewModel.handleActionClick}
          onSignOut={viewModel.handleSignOut}
        />
      </Drawer>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <p className="text-base font-semibold">{viewModel.businessName}</p>
          <Button
            aria-label={t("layout.sidebar.openMenu")}
            onClick={viewModel.toggleDrawer}
            size={BUTTON_SIZE.SM}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            <Menu className="size-5" />
          </Button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>

      <PlaceholderDialog
        item={placeholderQuickAccessItem}
        onClose={viewModel.closePlaceholderModal}
      />
    </div>
  );
};
