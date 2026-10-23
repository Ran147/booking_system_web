import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "@/components/common";
import {
  ERROR_MESSAGE_KEY,
  I18N_NAMESPACE,
  MONEY,
  QUERY_DEFAULTS,
  ROUTE_PATH,
} from "@/constants";
import {
  BUSINESS_STATUS,
  COLLABORATOR_PERMISSION,
  USER_ROLE,
  type ServiceDiscount,
  type UserRole,
} from "@/domain";
import { SESSION_STATUS, useCurrentBusiness, useSession } from "@/modules/auth";
import type { Nullable } from "@/types";
import {
  fetchBusinessInfo,
  useServiceDetailQuery,
  useUpdateServiceDiscountsMutation,
} from "../api";
import type { BusinessInfo } from "../api";
import {
  DISCOUNT_LIMIT,
  DISCOUNT_TYPE,
} from "../constants/ServiceDiscount.constants";
import type { ServiceDetail } from "../models/ServiceDetail.interface";
import type {
  DiscountFormState,
  ServiceDiscountsViewModel,
} from "../models/ServiceDiscountsViewModel.interface";
import {
  getCalendarDayUtcMidnight,
  hasDateRangeOverlap,
} from "../utils/discountCalculations";

export interface UseServiceDiscountsViewModelOptions {
  readonly businessInfo?: BusinessInfo;
  readonly initialService?: ServiceDetail;
  readonly onNavigate?: (path: string) => void;
  readonly serviceId?: string;
  readonly userPermissions?: readonly string[];
  readonly userRole?: UserRole;
}

const DEFAULT_FORM_STATE: DiscountFormState = Object.freeze({
  endsAt: "",
  startsAt: "",
  type: DISCOUNT_TYPE.PERCENTAGE,
  value: "",
});

export const useServiceDiscountsViewModel = (
  options: UseServiceDiscountsViewModelOptions = {},
): ServiceDiscountsViewModel => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
    I18N_NAMESPACE.VALIDATION,
  ]);
  const navigate = useNavigate();
  const session = useSession();
  const { businessId } = useCurrentBusiness();
  const updateDiscountsMutation = useUpdateServiceDiscountsMutation();

  const [formState, setFormState] =
    useState<DiscountFormState>(DEFAULT_FORM_STATE);
  const [formError, setFormError] = useState<Nullable<string>>(null);

  const currentRole =
    options.userRole ??
    (session.status === SESSION_STATUS.SIGNED_IN ? session.role : null);

  const permissions = options.userPermissions ?? [];

  const isUnauthorizedCollaborator =
    currentRole === USER_ROLE.COLLABORATOR &&
    !permissions.includes(COLLABORATOR_PERMISSION.MANAGE_SERVICES);

  useEffect(() => {
    if (isUnauthorizedCollaborator) {
      if (options.onNavigate) {
        options.onNavigate(ROUTE_PATH.BUSINESS.ROOT);
      } else {
        navigate(ROUTE_PATH.BUSINESS.ROOT);
      }
    }
  }, [isUnauthorizedCollaborator, navigate, options]);

  const businessInfoQuery = useQuery({
    enabled: options.businessInfo === undefined,
    initialData: options.businessInfo,
    queryFn: () => fetchBusinessInfo(businessId),
    queryKey: ["business", businessId, "info"],
    staleTime: QUERY_DEFAULTS.STALE_TIME_MS,
  });

  const serviceDetailQuery = useServiceDetailQuery({
    businessId,
    initialData: options.initialService,
    serviceId: options.serviceId,
  });

  const businessInfo = options.businessInfo ?? businessInfoQuery.data;
  const isBusinessLoading =
    options.businessInfo === undefined && businessInfoQuery.isLoading;
  const isServiceLoading =
    options.initialService === undefined && serviceDetailQuery.isLoading;
  const isLoading = isBusinessLoading || isServiceLoading;
  const isReadOnly =
    businessInfo?.status === BUSINESS_STATUS.INACTIVE ||
    businessInfo?.status === BUSINESS_STATUS.SUSPENDED;

  const service = serviceDetailQuery.data ?? options.initialService ?? null;
  const discounts = service?.discounts ?? [];

  const handleFormChange = <Key extends keyof DiscountFormState>(
    field: Key,
    value: DiscountFormState[Key],
  ): void => {
    setFormError(null);
    setFormState((previousState) => ({
      ...previousState,
      [field]: value,
    }));
  };

  const handleRetryLoad = (): void => {
    void serviceDetailQuery.refetch();
    void businessInfoQuery.refetch();
  };

  const handleAddDiscount = async (): Promise<void> => {
    if (isReadOnly) {
      setFormError(t("errors.readOnly", { ns: I18N_NAMESPACE.BUSINESS }));
      return;
    }

    if (
      !formState.startsAt ||
      !formState.endsAt ||
      formState.value === "" ||
      formState.value === undefined
    ) {
      setFormError(t("required", { ns: I18N_NAMESPACE.VALIDATION }));
      return;
    }

    const effectiveTimeZone = businessInfo?.timeZone ?? "UTC";
    const startsAtMidnight = getCalendarDayUtcMidnight(
      formState.startsAt,
      effectiveTimeZone,
    );
    const endsAtMidnight = getCalendarDayUtcMidnight(
      formState.endsAt,
      effectiveTimeZone,
    );

    if (endsAtMidnight < startsAtMidnight) {
      setFormError(
        t("services.discounts.invalidDateRangeError", {
          ns: I18N_NAMESPACE.BUSINESS,
        }),
      );
      return;
    }

    const startsAtDate = new Date(`${formState.startsAt}T12:00:00Z`);
    const endsAtDate = new Date(`${formState.endsAt}T12:00:00Z`);

    const numericValue = Number(formState.value);
    const servicePriceInCents = service?.priceInCents ?? 0;

    let valueToStore: number;

    if (formState.type === DISCOUNT_TYPE.PERCENTAGE) {
      if (
        numericValue < DISCOUNT_LIMIT.MIN_PERCENTAGE ||
        numericValue > DISCOUNT_LIMIT.MAX_PERCENTAGE
      ) {
        setFormError(t("outOfRange", { ns: I18N_NAMESPACE.VALIDATION }));
        return;
      }
      valueToStore = numericValue;
    } else {
      const amountInCents = Math.round(numericValue * MONEY.CENTS_PER_UNIT);
      if (
        amountInCents < DISCOUNT_LIMIT.MIN_FIXED_AMOUNT_CENTS ||
        amountInCents >= servicePriceInCents
      ) {
        setFormError(t("outOfRange", { ns: I18N_NAMESPACE.VALIDATION }));
        return;
      }
      valueToStore = amountInCents;
    }

    if (
      hasDateRangeOverlap(
        discounts,
        {
          endsAt: endsAtDate,
          startsAt: startsAtDate,
        },
        undefined,
        effectiveTimeZone,
      )
    ) {
      setFormError(
        t("services.discounts.overlapError", { ns: I18N_NAMESPACE.BUSINESS }),
      );
      return;
    }

    const newDiscount: ServiceDiscount = {
      endsAt: endsAtDate,
      startsAt: startsAtDate,
      type: formState.type,
      value: valueToStore,
    };

    try {
      await updateDiscountsMutation.mutateAsync({
        businessId,
        discounts: [...discounts, newDiscount],
        serviceId: options.serviceId ?? service?.id ?? "",
      });

      toast.success(
        t("services.discounts.saveSuccess", { ns: I18N_NAMESPACE.BUSINESS }),
      );
      setFormState(DEFAULT_FORM_STATE);
      setFormError(null);
    } catch {
      setFormError(t(ERROR_MESSAGE_KEY.NETWORK, { ns: I18N_NAMESPACE.COMMON }));
    }
  };

  const handleRemoveDiscount = async (indexToRemove: number): Promise<void> => {
    if (isReadOnly) {
      toast.error(t("errors.readOnly", { ns: I18N_NAMESPACE.BUSINESS }));
      return;
    }

    const nextDiscounts = discounts.filter(
      (_discount, index) => index !== indexToRemove,
    );

    try {
      await updateDiscountsMutation.mutateAsync({
        businessId,
        discounts: nextDiscounts,
        serviceId: options.serviceId ?? service?.id ?? "",
      });

      toast.success(
        t("services.discounts.removeSuccess", {
          ns: I18N_NAMESPACE.BUSINESS,
        }),
      );
    } catch {
      toast.error(t(ERROR_MESSAGE_KEY.NETWORK, { ns: I18N_NAMESPACE.COMMON }));
    }
  };

  return {
    currency: businessInfo?.currency ?? "USD",
    discounts,
    formError,
    formState,
    handleAddDiscount,
    handleFormChange,
    handleRemoveDiscount,
    handleRetryLoad,
    isAddPending: updateDiscountsMutation.isPending,
    isLoading,
    isLoadError: serviceDetailQuery.isError,
    isReadOnly,
    isRemovePending: updateDiscountsMutation.isPending,
    loadErrorMessageKey: serviceDetailQuery.isError
      ? ERROR_MESSAGE_KEY.NETWORK
      : null,
    service,
    timeZone: businessInfo?.timeZone ?? "UTC",
  };
};
