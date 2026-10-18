import type { ExpiryWarningType } from "@/modules/business/layout/constants";
import type { Nullable } from "@/types";

export interface ExpiryWarningBannerProps {
  readonly canDismiss?: boolean;
  readonly message?: Nullable<string>;
  readonly onDismiss?: () => void;
  readonly onNavigateToSubscription?: () => void;
  readonly onPay?: () => void;
  readonly type?: Nullable<ExpiryWarningType>;
}
