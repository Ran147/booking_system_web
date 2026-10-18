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
import {
  BusinessSidebar,
  ExpiryWarningBanner,
  SignOutConfirmDialog,
  SubscriptionBanner,
} from "./components";
import { useBusinessSidebarViewModel } from "./hooks";

export const BusinessLayout = (): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const location = useLocation();
  const viewModel = useBusinessSidebarViewModel();

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

  const sidebarBanners = (
    <div className="flex flex-col gap-2">
      <ExpiryWarningBanner
        cancelAtPeriodEnd={viewModel.subscription?.cancelAtPeriodEnd}
        currentPeriodEndsAt={viewModel.subscription?.currentPeriodEndsAt}
        gracePeriodDays={viewModel.gracePeriodDays}
        isCollaborator={viewModel.isCollaborator}
        isDismissed={viewModel.isExpiryWarningDismissed}
        isPlatformSettingsError={viewModel.isPlatformSettingsError}
        isSubscriptionError={viewModel.isSubscriptionError}
        onDismiss={viewModel.handleDismissExpiryWarning}
        onNavigateToSubscription={viewModel.handleNavigateToSubscription}
        onPay={viewModel.handleNavigateToSubscription}
        status={viewModel.subscription?.status}
        timeZone={viewModel.timeZone}
      />
      <SubscriptionBanner
        businessStatus={viewModel.businessStatus}
        cancelAtPeriodEnd={viewModel.subscription?.cancelAtPeriodEnd}
        currentPeriodEndsAt={viewModel.subscription?.currentPeriodEndsAt}
        isCollaborator={viewModel.isCollaborator}
        isError={viewModel.isSubscriptionError}
        isLoading={viewModel.isSubscriptionLoading}
        onPay={viewModel.handleNavigateToSubscription}
        onRetry={viewModel.handleRetrySubscription}
        planName={viewModel.planName}
        status={viewModel.subscription?.status}
        timeZone={viewModel.timeZone}
      />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Network error live region announcement */}
      {viewModel.businessError && (
        <div aria-live="assertive" className="sr-only" role="alert">
          {t("common:errors.network")}
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <BusinessSidebar
          activePath={location.pathname}
          banner={sidebarBanners}
          businessName={viewModel.businessName}
          collaboratorName={viewModel.collaboratorName}
          isCollaborator={viewModel.isCollaborator}
          isSubscriber={viewModel.isSubscriber}
          logoUrl={viewModel.logoUrl}
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
          banner={sidebarBanners}
          businessName={viewModel.businessName}
          collaboratorName={viewModel.collaboratorName}
          isCollaborator={viewModel.isCollaborator}
          isSubscriber={viewModel.isSubscriber}
          logoUrl={viewModel.logoUrl}
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
            aria-label={t("business:layout.sidebar.openMenu")}
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

      <SignOutConfirmDialog
        isOpen={viewModel.isSignOutConfirmOpen}
        onCancel={viewModel.handleCancelSignOut}
        onConfirm={viewModel.handleConfirmSignOut}
      />
    </div>
  );
};
