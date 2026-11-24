import { useQuery } from "@tanstack/react-query";
import { Calendar, Scissors } from "lucide-react";
import { useContext } from "react";
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

  const isSubscriber =
    role === USER_ROLE.SUBSCRIBER || role === USER_ROLE.BUSINESS_OWNER;
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

  const quickAccessItems = [] as const;

  const configurationItems = [] as const;

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
      value: t(`business:businessStatus.${businessStatus}`),
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
