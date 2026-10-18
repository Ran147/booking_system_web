import { SUBSCRIPTION_STATUS, type SubscriptionStatus } from "@/domain";
import { DEFAULT_PLATFORM_SETTINGS } from "@/domain/platform-settings/DefaultPlatformSettings.constants";
import type { Nullable } from "@/types";
import { BUSINESS_LAYOUT_CONSTANTS } from "../constants";
import type { ExpiryWarningBannerData } from "../models";
import {
  calculateGracePeriodExpiry,
  formatSubscriptionDate,
  getCalendarDayDifference,
} from "./subscriptionDates";

export interface CalculateExpiryWarningOptions {
  readonly cancelAtPeriodEnd?: boolean;
  readonly currentPeriodEndsAt?: Nullable<Date>;
  readonly gracePeriodDays?: Nullable<number>;
  readonly isCollaborator?: boolean;
  readonly isDismissed?: boolean;
  readonly isPlatformSettingsError?: boolean;
  readonly isSubscriptionError?: boolean;
  readonly language: string;
  readonly referenceDate?: unknown;
  readonly status?: Nullable<SubscriptionStatus>;
  readonly t: (key: string, options?: Record<string, unknown>) => string;
  readonly timeZone: string;
}

export const calculateExpiryWarning = ({
  cancelAtPeriodEnd = false,
  currentPeriodEndsAt,
  gracePeriodDays,
  isCollaborator = false,
  isDismissed = false,
  isPlatformSettingsError = false,
  isSubscriptionError = false,
  language,
  referenceDate,
  status,
  t,
  timeZone,
}: CalculateExpiryWarningOptions): Nullable<ExpiryWarningBannerData> => {
  if (
    isCollaborator ||
    isSubscriptionError ||
    !status ||
    !currentPeriodEndsAt
  ) {
    return null;
  }

  // Active subscription ending soon (cancelled at period end)
  if (status === SUBSCRIPTION_STATUS.ACTIVE) {
    if (!cancelAtPeriodEnd || isDismissed) {
      return null;
    }

    const remainingDays = getCalendarDayDifference(
      currentPeriodEndsAt,
      timeZone,
      referenceDate,
    );

    if (
      remainingDays > BUSINESS_LAYOUT_CONSTANTS.EXPIRY_WARNING.MAX_DAYS ||
      remainingDays < BUSINESS_LAYOUT_CONSTANTS.EXPIRY_WARNING.MIN_DAYS
    ) {
      return null;
    }

    const formattedDate = formatSubscriptionDate(
      currentPeriodEndsAt,
      timeZone,
      language,
    );

    const message =
      remainingDays === BUSINESS_LAYOUT_CONSTANTS.EXPIRY_WARNING.MIN_DAYS
        ? t("layout.expiryWarning.endsToday")
        : t("layout.expiryWarning.message", {
            count: remainingDays,
            date: formattedDate,
          });

    return {
      canDismiss: true,
      message,
      type: "active_ending_soon",
    };
  }

  // Past due subscription (cannot be dismissed)
  if (status === SUBSCRIPTION_STATUS.PAST_DUE) {
    const hasGraceSettings =
      !isPlatformSettingsError &&
      gracePeriodDays !== null &&
      gracePeriodDays !== undefined;

    if (!hasGraceSettings) {
      return {
        canDismiss: false,
        message: t("layout.expiryWarning.pastDueNoCountdown"),
        type: "past_due",
      };
    }

    const effectiveGraceDays =
      gracePeriodDays ?? DEFAULT_PLATFORM_SETTINGS.GRACE_PERIOD_DAYS;
    const expiryDate = calculateGracePeriodExpiry(
      currentPeriodEndsAt,
      effectiveGraceDays,
    );
    const daysLeft = Math.max(
      BUSINESS_LAYOUT_CONSTANTS.EXPIRY_WARNING.MIN_DAYS,
      getCalendarDayDifference(expiryDate, timeZone, referenceDate),
    );
    const formattedGraceDate = formatSubscriptionDate(
      expiryDate,
      timeZone,
      language,
    );

    return {
      canDismiss: false,
      message: t("layout.expiryWarning.pastDue", {
        count: daysLeft,
        date: formattedGraceDate,
      }),
      type: "past_due",
    };
  }

  return null;
};
