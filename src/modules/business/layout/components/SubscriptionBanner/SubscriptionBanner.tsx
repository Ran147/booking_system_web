import { CreditCard, RotateCcw } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  BADGE_VARIANT,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from "@/components/common";
import type { BadgeVariant } from "@/components/common/badge/models/badge.model";
import { I18N_NAMESPACE } from "@/constants";
import {
  BUSINESS_STATUS,
  SUBSCRIPTION_STATUS,
  type SubscriptionStatus,
} from "@/domain";
import { formatSubscriptionDate } from "@/modules/business/layout/utils";
import type { Nullable } from "@/types";
import type { SubscriptionBannerProps } from "./SubscriptionBanner.types";

const resolveBadgeVariant = (
  status: Nullable<SubscriptionStatus>,
): BadgeVariant => {
  switch (status) {
    case SUBSCRIPTION_STATUS.ACTIVE:
      return BADGE_VARIANT.DEFAULT;
    case SUBSCRIPTION_STATUS.PAST_DUE:
      return BADGE_VARIANT.WARNING;
    case SUBSCRIPTION_STATUS.EXPIRED:
    case SUBSCRIPTION_STATUS.CANCELLED:
      return BADGE_VARIANT.DESTRUCTIVE;
    default:
      return BADGE_VARIANT.OUTLINE;
  }
};

export const SubscriptionBanner = ({
  businessStatus = BUSINESS_STATUS.ACTIVE,
  cancelAtPeriodEnd = false,
  currentPeriodEndsAt,
  isCollaborator = false,
  isError = false,
  isLoading = false,
  onPay,
  onRetry,
  planName,
  status = SUBSCRIPTION_STATUS.ACTIVE,
  timeZone = "UTC",
}: SubscriptionBannerProps): Nullable<ReactElement> => {
  const { i18n, t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);

  if (isCollaborator) {
    return null;
  }

  if (isError) {
    return (
      <div
        aria-label={t("business:layout.subscriptionBanner.ariaLabel")}
        className="flex flex-col gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs"
        role="region"
      >
        <p className="font-medium text-destructive">
          {t("business:layout.subscriptionBanner.loadError")}
        </p>
        {onRetry && (
          <Button
            aria-label={t("business:layout.subscriptionBanner.retry")}
            className="w-full justify-center gap-1.5"
            onClick={onRetry}
            size={BUTTON_SIZE.SM}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            <RotateCcw className="size-3.5" />
            <span>{t("business:layout.subscriptionBanner.retry")}</span>
          </Button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        aria-label={t("business:layout.subscriptionBanner.ariaLabel")}
        className="flex animate-pulse flex-col gap-2 rounded-xl border border-border/70 bg-muted/40 p-3"
        role="region"
      >
        <div className="h-4 w-24 rounded-sm bg-muted" />
        <div className="h-3 w-32 rounded-sm bg-muted" />
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const effectivePlanName =
    planName || t("business:layout.sidebar.subscription");
  const formattedDate = formatSubscriptionDate(
    currentPeriodEndsAt,
    timeZone,
    i18n.language,
  );

  const statusLabel = t(`common:subscriptionStatus.${status}`, {
    defaultValue: status,
  });

  const isSuspended = businessStatus === BUSINESS_STATUS.SUSPENDED;
  const isPastDue = status === SUBSCRIPTION_STATUS.PAST_DUE;
  const isExpiredOrCancelled =
    status === SUBSCRIPTION_STATUS.EXPIRED ||
    status === SUBSCRIPTION_STATUS.CANCELLED;

  return (
    <div
      aria-label={t("business:layout.subscriptionBanner.ariaLabel")}
      className="flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card/60 p-3 text-xs text-card-foreground shadow-2xs"
      role="region"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="truncate font-semibold tracking-tight text-foreground"
          title={effectivePlanName}
        >
          {effectivePlanName}
        </span>
        <Badge variant={resolveBadgeVariant(status)}>{statusLabel}</Badge>
      </div>

      {status === SUBSCRIPTION_STATUS.ACTIVE && formattedDate && (
        <p className="text-muted-foreground">
          {cancelAtPeriodEnd
            ? t("business:layout.subscriptionBanner.endsOn", {
                date: formattedDate,
              })
            : t("business:layout.subscriptionBanner.renewsOn", {
                date: formattedDate,
              })}
        </p>
      )}

      {isSuspended ? (
        <p className="font-medium text-destructive">
          {t("business:layout.subscriptionBanner.suspendedNotice")}
        </p>
      ) : (
        <>
          {isExpiredOrCancelled && (
            <p className="font-medium text-destructive">
              {t("business:layout.subscriptionBanner.readOnlyNotice")}
            </p>
          )}

          {(isPastDue || isExpiredOrCancelled) && onPay && (
            <Button
              className="mt-1 w-full justify-center gap-1.5 font-medium"
              onClick={onPay}
              size={BUTTON_SIZE.SM}
              type="button"
              variant={BUTTON_VARIANT.DEFAULT}
            >
              <CreditCard className="size-3.5" />
              <span>{t("business:layout.subscriptionBanner.payLink")}</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
};
