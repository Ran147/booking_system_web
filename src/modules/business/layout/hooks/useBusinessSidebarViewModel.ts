import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FIRESTORE_COLLECTION, I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import {
  BUSINESS_STATUS,
  USER_ROLE,
  type BusinessStatus,
  type UserRole,
} from "@/domain";
import { SESSION_STATUS } from "@/modules/auth/constants/SessionStatus.constants";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import type { Nullable } from "@/types";
import {
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
import type { UseBusinessSidebarViewModelOptions } from "./useBusinessSidebarViewModel.types";

export const useBusinessSidebarViewModel = (
  options: UseBusinessSidebarViewModelOptions = {},
): BusinessSidebarViewModel => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authContext = useContext(AuthContext);

  const [activePlaceholderItem, setActivePlaceholderItem] =
    useState<Nullable<BusinessSidebarItem>>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isExpiryWarningDismissed, setIsExpiryWarningDismissed] =
    useState<boolean>(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] =
    useState<boolean>(false);

  const session = authContext?.session;
  const isSessionSignedIn = session?.status === SESSION_STATUS.SIGNED_IN;

  const businessId =
    isSessionSignedIn && session.businessId
      ? session.businessId
      : "business-test";

  const collaboratorId =
    isSessionSignedIn && session.collaboratorId ? session.collaboratorId : null;

  const role: UserRole =
    isSessionSignedIn && session.role ? session.role : USER_ROLE.SUBSCRIBER;

  const isSubscriber = role === USER_ROLE.SUBSCRIBER;
  const isCollaborator = role === USER_ROLE.COLLABORATOR;

  const businessProfileQuery = useQuery<BusinessProfileData>({
    enabled: Boolean(businessId),
    queryFn: () => fetchBusinessProfile(businessId),
    queryKey: [FIRESTORE_COLLECTION.BUSINESSES, businessId, "profile"],
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
    queryKey: [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.COLLABORATORS,
      collaboratorId,
    ],
  });

  const collaboratorName =
    options.collaboratorName ??
    (collaboratorProfileQuery.data?.fullName || null);

  const subscriptionQuery = useQuery<Nullable<CurrentSubscriptionData>>({
    enabled: Boolean(isSubscriber && businessId),
    queryFn: () => fetchCurrentSubscription(businessId),
    queryKey: [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SUBSCRIPTION,
      "current",
    ],
  });

  const planId = subscriptionQuery.data?.planId ?? "";

  const planQuery = useQuery<string>({
    enabled: Boolean(isSubscriber && planId),
    queryFn: () => fetchPlanName(planId),
    queryKey: [FIRESTORE_COLLECTION.PLANS, planId],
  });

  const platformSettingsQuery = useQuery<PlatformSettingsData>({
    enabled: Boolean(isSubscriber),
    queryFn: fetchPlatformSettings,
    queryKey: [FIRESTORE_COLLECTION.PLATFORM_SETTINGS, "current"],
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
    try {
      queryClient.clear();
      if (options.onSignOut) {
        options.onSignOut();
        return;
      }
      navigate(ROUTE_PATH.AUTH.SIGN_IN);
    } catch {
      queryClient.clear();
      navigate(ROUTE_PATH.AUTH.SIGN_IN);
    }
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
          {
            description: t("business:layout.sidebar.settingsDescription"),
            icon: Settings,
            id: "settings",
            isAvailable: false,
            isSubscriberOnly: true,
            label: t("business:layout.sidebar.settings"),
          },
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
