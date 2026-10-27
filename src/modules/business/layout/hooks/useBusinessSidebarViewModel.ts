import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Calendar,
  CreditCard,
  LayoutDashboard,
  Scissors,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import { BUSINESS_STATUS, USER_ROLE, type BusinessStatus } from "@/domain";
import {
  SESSION_STATUS,
  useCurrentBusiness,
  useSession,
  useSignOut,
} from "@/modules/auth";
import { canManageBusinessProfile } from "@/modules/business/businessProfileAccess";
import type { Nullable } from "@/types";
import {
  businessLayoutQueryKeys,
  fetchBusinessProfile,
  fetchCollaboratorProfile,
  fetchCurrentSubscription,
  fetchPlanName,
  fetchPlatformSettings,
  type BusinessProfileData,
  type CollaboratorProfileData,
  type CurrentSubscriptionData,
  type PlatformSettingsData,
} from "../api";
import type { BusinessSidebarItem, BusinessSidebarViewModel } from "../models";
import { calculateExpiryWarning } from "../utils";
import type { UseBusinessSidebarViewModelOptions } from "./useBusinessSidebarViewModel.types";

export const useBusinessSidebarViewModel = (
  options: UseBusinessSidebarViewModelOptions = {},
): BusinessSidebarViewModel => {
  const { i18n, t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const navigate = useNavigate();
  const signOut = useSignOut();
  const session = useSession();
  const { businessId } = useCurrentBusiness();

  const [activePlaceholderItem, setActivePlaceholderItem] =
    useState<Nullable<BusinessSidebarItem>>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isExpiryWarningDismissed, setIsExpiryWarningDismissed] =
    useState<boolean>(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] =
    useState<boolean>(false);

  const isCollaborator =
    session.status === SESSION_STATUS.SIGNED_IN &&
    session.role === USER_ROLE.COLLABORATOR;
  const isSubscriber =
    session.status === SESSION_STATUS.SIGNED_IN &&
    canManageBusinessProfile(session.role);

  const collaboratorId =
    isCollaborator && session.collaboratorId ? session.collaboratorId : null;

  const businessProfileQuery = useQuery<BusinessProfileData>({
    enabled: Boolean(businessId),
    queryFn: () => fetchBusinessProfile(businessId),
    queryKey: businessLayoutQueryKeys.profile(businessId),
  });

  const businessName =
    options.businessName ??
    (businessProfileQuery.data?.name || t("business:placeholder.title"));

  const logoUrl =
    options.logoUrl !== undefined
      ? options.logoUrl
      : (businessProfileQuery.data?.logoUrl ?? null);

  const timeZone = businessProfileQuery.data?.timeZone || "UTC";

  const businessStatus: BusinessStatus =
    options.initialBusinessStatus ??
    businessProfileQuery.data?.status ??
    BUSINESS_STATUS.ACTIVE;

  const collaboratorProfileQuery = useQuery<CollaboratorProfileData>({
    enabled: Boolean(isCollaborator && businessId && collaboratorId),
    queryFn: () => fetchCollaboratorProfile(businessId, collaboratorId ?? ""),
    queryKey: businessLayoutQueryKeys.collaboratorProfile(
      businessId,
      collaboratorId ?? "",
    ),
  });

  const collaboratorName =
    options.collaboratorName ??
    (collaboratorProfileQuery.data?.fullName || null);

  const subscriptionQuery = useQuery<Nullable<CurrentSubscriptionData>>({
    enabled: Boolean(isSubscriber && businessId),
    queryFn: () => fetchCurrentSubscription(businessId),
    queryKey: businessLayoutQueryKeys.subscription(businessId),
  });

  const planId = subscriptionQuery.data?.planId ?? "";

  const planQuery = useQuery<string>({
    enabled: Boolean(isSubscriber && planId),
    queryFn: () => fetchPlanName(planId),
    queryKey: businessLayoutQueryKeys.planName(planId),
  });

  const platformSettingsQuery = useQuery<PlatformSettingsData>({
    enabled: Boolean(isSubscriber),
    queryFn: fetchPlatformSettings,
    queryKey: businessLayoutQueryKeys.platformSettings(),
  });

  const expiryWarning = calculateExpiryWarning({
    cancelAtPeriodEnd: subscriptionQuery.data?.cancelAtPeriodEnd,
    currentPeriodEndsAt: subscriptionQuery.data?.currentPeriodEndsAt,
    gracePeriodDays: platformSettingsQuery.data?.gracePeriodDays ?? null,
    isCollaborator,
    isDismissed: isExpiryWarningDismissed,
    isPlatformSettingsError: platformSettingsQuery.isError,
    isSubscriptionError: subscriptionQuery.isError,
    language: i18n.language,
    referenceDate: options.referenceDate,
    status: subscriptionQuery.data?.status,
    t: (key: string, translationOptions?: Record<string, unknown>): string =>
      String(t(key as never, translationOptions as never)),
    timeZone,
  });

  const handleActionClick = (item: BusinessSidebarItem): void => {
    if (item.isAvailable && item.href) {
      setIsDrawerOpen(false);
      if (options.onNavigate) {
        options.onNavigate(item.href);
      } else {
        navigate(item.href);
      }
    } else {
      setActivePlaceholderItem(item);
    }
  };

  const closePlaceholderModal = (): void => {
    setActivePlaceholderItem(null);
  };

  const executeSignOut = (): void => {
    if (options.onSignOut) {
      try {
        options.onSignOut();
      } catch {
        // Proceed even if custom handler throws
      }
      return;
    }
    void signOut();
  };

  const handleSignOut = (): void => {
    if (options.hasUnsavedChanges) {
      setIsSignOutConfirmOpen(true);
      return;
    }
    executeSignOut();
  };

  const handleConfirmSignOut = (): void => {
    setIsSignOutConfirmOpen(false);
    executeSignOut();
  };

  const handleCancelSignOut = (): void => {
    setIsSignOutConfirmOpen(false);
  };

  const handleDismissExpiryWarning = (): void => {
    setIsExpiryWarningDismissed(true);
  };

  const handleNavigateToSubscription = (): void => {
    const targetPath = `/business/${ROUTE_PATH.BUSINESS.SUBSCRIPTION}`;
    if (options.onNavigate) {
      options.onNavigate(targetPath);
    } else {
      navigate(targetPath);
    }
  };

  const handleRetrySubscription = (): void => {
    subscriptionQuery.refetch();
  };

  const toggleDrawer = (): void => {
    setIsDrawerOpen((previousState) => !previousState);
  };

  const closeDrawer = (): void => {
    setIsDrawerOpen(false);
  };

  const allNavItems: BusinessSidebarItem[] = [
    {
      description: t("business:layout.sidebar.dashboardDescription"),
      href: ROUTE_PATH.BUSINESS.ROOT,
      icon: LayoutDashboard,
      id: "dashboard",
      isAvailable: true,
      label: t("business:layout.sidebar.dashboard"),
    },
    {
      description: t("business:layout.sidebar.servicesDescription"),
      href: `/business/${ROUTE_PATH.BUSINESS.SERVICES}`,
      icon: Scissors,
      id: "services",
      isAvailable: true,
      label: t("business:layout.sidebar.services"),
    },
    {
      description: t("business:layout.sidebar.scheduleDescription"),
      icon: Calendar,
      id: "schedule",
      isAvailable: false,
      label: t("business:layout.sidebar.schedule"),
    },
    {
      description: t("business:layout.sidebar.customersDescription"),
      icon: Users,
      id: "customers",
      isAvailable: false,
      label: t("business:layout.sidebar.customers"),
    },
    {
      description: t("business:layout.sidebar.reportsDescription"),
      icon: BarChart3,
      id: "reports",
      isAvailable: false,
      label: t("business:layout.sidebar.reports"),
    },
    ...(isSubscriber
      ? [
          {
            description: t("business:layout.sidebar.collaboratorsDescription"),
            icon: UserCheck,
            id: "collaborators",
            isAvailable: false,
            isSubscriberOnly: true,
            label: t("business:layout.sidebar.collaborators"),
          },
        ]
      : []),
    {
      description: t("business:layout.sidebar.settingsDescription"),
      href: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS}`,
      icon: Settings,
      id: "settings",
      isAvailable: true,
      label: t("business:layout.sidebar.settings"),
    },
    ...(isSubscriber
      ? [
          {
            description: t("business:layout.sidebar.subscriptionDescription"),
            icon: CreditCard,
            id: "subscription",
            isAvailable: false,
            isSubscriberOnly: true,
            label: t("business:layout.sidebar.subscription"),
          },
        ]
      : []),
  ];

  return {
    activePlaceholderItem,
    businessError: businessProfileQuery.isError,
    businessName,
    businessStatus,
    closeDrawer,
    closePlaceholderModal,
    collaboratorName,
    expiryWarning,
    gracePeriodDays: platformSettingsQuery.data?.gracePeriodDays ?? null,
    handleActionClick,
    handleCancelSignOut,
    handleConfirmSignOut,
    handleDismissExpiryWarning,
    handleNavigateToSubscription,
    handleRetrySubscription,
    handleSignOut,
    isCollaborator,
    isDrawerOpen,
    isExpiryWarningDismissed,
    isPlatformSettingsError: platformSettingsQuery.isError,
    isSignOutConfirmOpen,
    isSubscriber,
    isSubscriptionError: subscriptionQuery.isError,
    isSubscriptionLoading: subscriptionQuery.isLoading,
    logoUrl,
    navItems: allNavItems,
    planName: planQuery.data || null,
    subscription: subscriptionQuery.data ?? null,
    timeZone,
    toggleDrawer,
  };
};
