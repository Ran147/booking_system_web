import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Calendar,
  CreditCard,
  Scissors,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";
import { useContext } from "react";
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
import { fetchBusinessStatus } from "../api";
import type { BusinessHomeViewModel } from "../models";
import type { UseBusinessHomeViewModelOptions } from "./useBusinessHomeViewModel.types";

export type { UseBusinessHomeViewModelOptions };

export const useBusinessHomeViewModel = (
  options: UseBusinessHomeViewModelOptions = {},
): BusinessHomeViewModel => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const session = authContext?.session;
  const isSessionSignedIn = session?.status === SESSION_STATUS.SIGNED_IN;

  const businessId =
    isSessionSignedIn && session.businessId
      ? session.businessId
      : "business-test";

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

  const isReadOnly = businessStatus !== BUSINESS_STATUS.ACTIVE;

  const handleNavigateToServiceCreate = (): void => {
    const targetPath = `/business/${ROUTE_PATH.BUSINESS.SERVICE_NEW}`;
    if (options.onNavigate) {
      options.onNavigate(targetPath);
    } else {
      navigate(targetPath);
    }
  };

  const quickAccessItems = [
    {
      actionLabel: t("business:home.tools.services.action"),
      badgeLabel: t("business:home.status.available"),
      badgeVariant: BADGE_VARIANT.DEFAULT,
      description: t("business:home.tools.services.description"),
      href: `/business/${ROUTE_PATH.BUSINESS.SERVICE_NEW}`,
      icon: Scissors,
      id: "services",
      isAvailable: true,
      onClick: handleNavigateToServiceCreate,
      title: t("business:home.tools.services.title"),
    },
    {
      actionLabel: t("business:home.status.comingSoon"),
      badgeLabel: t("business:home.status.comingSoon"),
      badgeVariant: BADGE_VARIANT.MUTED,
      description: t("business:home.tools.schedule.description"),
      icon: Calendar,
      id: "schedule",
      isAvailable: false,
      title: t("business:home.tools.schedule.title"),
    },
    {
      actionLabel: t("business:home.status.comingSoon"),
      badgeLabel: t("business:home.status.comingSoon"),
      badgeVariant: BADGE_VARIANT.MUTED,
      description: t("business:home.tools.customers.description"),
      icon: Users,
      id: "customers",
      isAvailable: false,
      title: t("business:home.tools.customers.title"),
    },
    {
      actionLabel: t("business:home.status.comingSoon"),
      badgeLabel: t("business:home.status.comingSoon"),
      badgeVariant: BADGE_VARIANT.MUTED,
      description: t("business:home.tools.reports.description"),
      icon: BarChart3,
      id: "reports",
      isAvailable: false,
      title: t("business:home.tools.reports.title"),
    },
    ...(isSubscriber
      ? [
          {
            actionLabel: t("business:home.status.comingSoon"),
            badgeLabel: t("business:home.status.comingSoon"),
            badgeVariant: BADGE_VARIANT.MUTED,
            description: t("business:home.tools.collaborators.description"),
            icon: UserCheck,
            id: "collaborators",
            isAvailable: false,
            title: t("business:home.tools.collaborators.title"),
          },
        ]
      : []),
  ];

  const configurationItems = [
    {
      actionLabel: t("business:home.configs.settings.action"),
      badgeLabel: t("business:home.status.comingSoon"),
      badgeVariant: BADGE_VARIANT.MUTED,
      description: t("business:home.configs.settings.description"),
      icon: Settings,
      id: "settings",
      isAvailable: false,
      title: t("business:home.configs.settings.title"),
    },
    ...(isSubscriber
      ? [
          {
            actionLabel: t("business:home.configs.subscription.action"),
            badgeLabel: t("business:home.status.comingSoon"),
            badgeVariant: BADGE_VARIANT.MUTED,
            description: t("business:home.configs.subscription.description"),
            icon: CreditCard,
            id: "subscription",
            isAvailable: false,
            title: t("business:home.configs.subscription.title"),
          },
        ]
      : []),
  ];

  const metrics = [
    {
      helperText: t("business:home.metrics.activeServices.helper"),
      icon: Scissors,
      id: "active-services",
      label: t("business:home.metrics.activeServices.label"),
      value: "1",
    },
    {
      helperText: t("business:home.metrics.businessStatus.helper"),
      id: "business-status",
      label: t("business:home.metrics.businessStatus.label"),
      value:
        businessStatus === BUSINESS_STATUS.ACTIVE
          ? t("business:home.metrics.businessStatus.value")
          : businessStatus,
    },
    {
      helperText: t("business:home.metrics.todayBookings.helper"),
      icon: Calendar,
      id: "today-bookings",
      label: t("business:home.metrics.todayBookings.label"),
      value: "0",
    },
  ];

  return {
    businessId,
    businessStatus,
    configurationItems,
    handleNavigateToServiceCreate,
    isCollaborator,
    isLoading: businessStatusQuery.isLoading,
    isReadOnly,
    isSubscriber,
    metrics,
    quickAccessItems,
    role,
  };
};
