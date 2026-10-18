import type { SubscriptionStatus } from "@/domain";
import type { Nullable } from "@/types";

export interface ExpiryWarningBannerProps {
  readonly cancelAtPeriodEnd?: boolean;
  readonly currentPeriodEndsAt?: unknown;
  readonly gracePeriodDays?: Nullable<number>;
  readonly isCollaborator?: boolean;
  readonly isDismissed?: boolean;
  readonly isPlatformSettingsError?: boolean;
  readonly isSubscriptionError?: boolean;
  readonly onDismiss?: () => void;
  readonly onNavigateToSubscription?: () => void;
  readonly onPay?: () => void;
  readonly referenceDate?: unknown;
  readonly status?: Nullable<SubscriptionStatus>;
  readonly timeZone?: string;
}
