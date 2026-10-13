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
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { BADGE_VARIANT } from "@/components/common/badge/constants/badge.constants";
import { FIRESTORE_COLLECTION, I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import {
  BUSINESS_STATUS,
  USER_ROLE,
  type BusinessStatus,
  type UserRole,
} from "@/domain";
import { SESSION_STATUS } from "@/modules/auth/constants/SessionStatus.constants";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { fetchBusinessStatus } from "@/modules/business/features/home";
import type { Nullable } from "@/types";
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
  const authContext = useContext(AuthContext);

  const [activePlaceholderItem, setActivePlaceholderItem] =
    useState<Nullable<BusinessSidebarItem>>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const session = authContext?.session;
  const isSessionSignedIn = session?.status === SESSION_STATUS.SIGNED_IN;

  const businessId =
    isSessionSignedIn && session.businessId
      ? session.businessId
      : "business-test";

  const businessName = options.businessName ?? t("business:placeholder.title");

  const role: UserRole =
    isSessionSignedIn && session.role ? session.role : USER_ROLE.SUBSCRIBER;

  const isSubscriber = role === USER_ROLE.SUBSCRIBER;
  const isCollaborator = role === USER_ROLE.COLLABORATOR;

  const businessStatusQuery = useQuery<BusinessStatus>({
    enabled: options.initialBusinessStatus === undefined,
    queryFn: () => fetchBusinessStatus(businessId),
    queryKey: [FIRESTORE_COLLECTION.BUSINESSES, businessId, "status"],
  });

  const businessStatus: BusinessStatus =
    options.initialBusinessStatus ??
    businessStatusQuery.data ??
    BUSINESS_STATUS.ACTIVE;

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

  const handleSignOut = (): void => {
    if (options.onSignOut) {
      options.onSignOut();
      return;
    }
    navigate(ROUTE_PATH.AUTH.SIGN_IN);
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
      badgeLabel: t("business:home.status.available"),
      badgeVariant: BADGE_VARIANT.DEFAULT,
      description: t("business:layout.sidebar.servicesDescription"),
      href: `/business/${ROUTE_PATH.BUSINESS.SERVICES}`,
      icon: Scissors,
      id: "services",
      isAvailable: true,
      label: t("business:layout.sidebar.services"),
    },
    {
      badgeLabel: t("business:home.status.comingSoon"),
      badgeVariant: BADGE_VARIANT.MUTED,
      description: t("business:layout.sidebar.scheduleDescription"),
      icon: Calendar,
      id: "schedule",
      isAvailable: false,
      label: t("business:layout.sidebar.schedule"),
    },
    {
      badgeLabel: t("business:home.status.comingSoon"),
      badgeVariant: BADGE_VARIANT.MUTED,
      description: t("business:layout.sidebar.customersDescription"),
      icon: Users,
      id: "customers",
      isAvailable: false,
      label: t("business:layout.sidebar.customers"),
    },
    {
      badgeLabel: t("business:home.status.comingSoon"),
      badgeVariant: BADGE_VARIANT.MUTED,
      description: t("business:layout.sidebar.reportsDescription"),
      icon: BarChart3,
      id: "reports",
      isAvailable: false,
      label: t("business:layout.sidebar.reports"),
    },
    ...(isSubscriber
      ? [
          {
            badgeLabel: t("business:home.status.comingSoon"),
            badgeVariant: BADGE_VARIANT.MUTED,
            description: t("business:layout.sidebar.collaboratorsDescription"),
            icon: UserCheck,
            id: "collaborators",
            isAvailable: false,
            isSubscriberOnly: true,
            label: t("business:layout.sidebar.collaborators"),
          },
          {
            badgeLabel: t("business:home.status.comingSoon"),
            badgeVariant: BADGE_VARIANT.MUTED,
            description: t("business:layout.sidebar.settingsDescription"),
            icon: Settings,
            id: "settings",
            isAvailable: false,
            isSubscriberOnly: true,
            label: t("business:layout.sidebar.settings"),
          },
          {
            badgeLabel: t("business:home.status.comingSoon"),
            badgeVariant: BADGE_VARIANT.MUTED,
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
    businessName,
    businessStatus,
    closeDrawer,
    closePlaceholderModal,
    handleActionClick,
    handleSignOut,
    isCollaborator,
    isDrawerOpen,
    isSubscriber,
    navItems: allNavItems,
    toggleDrawer,
  };
};
