import type { BusinessStatus, SubscriptionStatus } from "@/domain";
import type { Nullable } from "@/types";

export interface SubscriptionBannerProps {
  readonly businessStatus?: BusinessStatus;
  readonly cancelAtPeriodEnd?: boolean;
  readonly currentPeriodEndsAt?: unknown;
  readonly isCollaborator?: boolean;
  readonly isError?: boolean;
  readonly isLoading?: boolean;
  readonly onPay?: () => void;
  readonly onRetry?: () => void;
  readonly planName?: Nullable<string>;
  readonly status?: Nullable<SubscriptionStatus>;
  readonly timeZone?: string;
}
