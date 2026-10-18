import { AlertTriangle, CreditCard, X } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { SUBSCRIPTION_STATUS } from "@/domain";
import { DEFAULT_PLATFORM_SETTINGS } from "@/domain/platform-settings/DefaultPlatformSettings.constants";
import {
  calculateGracePeriodExpiry,
  formatSubscriptionDate,
  getCalendarDayDifference,
} from "@/modules/business/layout/utils";
import type { Nullable } from "@/types";
import type { ExpiryWarningBannerProps } from "./ExpiryWarningBanner.types";

const MAX_WARNING_DAYS = 7;
const MIN_WARNING_DAYS = 0;

export const ExpiryWarningBanner = ({
  cancelAtPeriodEnd = false,
  currentPeriodEndsAt,
  gracePeriodDays,
  isCollaborator = false,
  isDismissed = false,
  isPlatformSettingsError = false,
  isSubscriptionError = false,
  onDismiss,
  onNavigateToSubscription,
  onPay,
  referenceDate,
  status,
  timeZone = "UTC",
}: ExpiryWarningBannerProps): Nullable<ReactElement> => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  if (isCollaborator || isSubscriptionError || !status) {
    return null;
  }

  // Active subscription ending soon
  if (status === SUBSCRIPTION_STATUS.ACTIVE) {
    if (!cancelAtPeriodEnd || isDismissed) {
      return null;
    }

    const remainingDays = getCalendarDayDifference(
      currentPeriodEndsAt,
      timeZone,
      referenceDate,
    );

    if (remainingDays > MAX_WARNING_DAYS || remainingDays < MIN_WARNING_DAYS) {
      return null;
    }

    const formattedDate = formatSubscriptionDate(
      currentPeriodEndsAt,
      timeZone,
      i18n.language,
    );

    const message =
      remainingDays === MIN_WARNING_DAYS
        ? t("layout.expiryWarning.endsToday")
        : t("layout.expiryWarning.message", {
            count: remainingDays,
            date: formattedDate,
          });

    return (
      <div
        aria-label={t("layout.expiryWarning.ariaLabel")}
        className="flex flex-col gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-foreground shadow-2xs"
        role="alert"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-warning">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{t("layout.expiryWarning.ariaLabel")}</span>
          </div>
          {onDismiss && (
            <Button
              aria-label={t("layout.expiryWarning.dismiss")}
              className="size-5 shrink-0 p-0 text-muted-foreground hover:text-foreground"
              onClick={onDismiss}
              size={BUTTON_SIZE.SM}
              type="button"
              variant={BUTTON_VARIANT.GHOST}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        <p className="text-muted-foreground">{message}</p>

        {onNavigateToSubscription && (
          <Button
            className="w-full justify-center text-xs"
            onClick={onNavigateToSubscription}
            size={BUTTON_SIZE.SM}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            <span>{t("layout.subscriptionBanner.viewPlan")}</span>
          </Button>
        )}
      </div>
    );
  }

  // Past due subscription (cannot be dismissed)
  if (status === SUBSCRIPTION_STATUS.PAST_DUE) {
    const hasGraceSettings =
      !isPlatformSettingsError &&
      gracePeriodDays !== null &&
      gracePeriodDays !== undefined;

    let pastDueMessage = t("layout.expiryWarning.pastDueNoCountdown");

    if (hasGraceSettings) {
      const effectiveGraceDays =
        gracePeriodDays ?? DEFAULT_PLATFORM_SETTINGS.GRACE_PERIOD_DAYS;
      const expiryDate = calculateGracePeriodExpiry(
        currentPeriodEndsAt,
        effectiveGraceDays,
      );
      const daysLeft = Math.max(
        MIN_WARNING_DAYS,
        getCalendarDayDifference(expiryDate, timeZone, referenceDate),
      );
      const formattedGraceDate = formatSubscriptionDate(
        expiryDate,
        timeZone,
        i18n.language,
      );

      pastDueMessage = t("layout.expiryWarning.pastDue", {
        count: daysLeft,
        date: formattedGraceDate,
      });
    }

    return (
      <div
        aria-label={t("layout.expiryWarning.ariaLabel")}
        className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-foreground shadow-2xs"
        role="alert"
      >
        <div className="flex items-center gap-1.5 font-medium text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{t("layout.expiryWarning.ariaLabel")}</span>
        </div>

        <p className="text-muted-foreground">{pastDueMessage}</p>

        {onPay && (
          <Button
            className="w-full justify-center gap-1.5 text-xs font-medium"
            onClick={onPay}
            size={BUTTON_SIZE.SM}
            type="button"
            variant={BUTTON_VARIANT.DEFAULT}
          >
            <CreditCard className="size-3.5" />
            <span>{t("layout.expiryWarning.payLink")}</span>
          </Button>
        )}
      </div>
    );
  }

  return null;
};
