import { AlertTriangle, CreditCard, X } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { BUSINESS_LAYOUT_CONSTANTS } from "@/modules/business/layout/constants";
import type { Nullable } from "@/types";
import type { ExpiryWarningBannerProps } from "./ExpiryWarningBanner.types";

export const ExpiryWarningBanner = ({
  canDismiss = false,
  message,
  onDismiss,
  onNavigateToSubscription,
  onPay,
  type,
}: ExpiryWarningBannerProps): Nullable<ReactElement> => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  if (!type || !message) {
    return null;
  }

  if (
    type === BUSINESS_LAYOUT_CONSTANTS.EXPIRY_WARNING_TYPE.ACTIVE_ENDING_SOON
  ) {
    return (
      <div
        aria-label={t("layout.expiryWarning.ariaLabel")}
        className="flex flex-col gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-foreground shadow-2xs"
        role="status"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-warning">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{t("layout.expiryWarning.ariaLabel")}</span>
          </div>
          {canDismiss && onDismiss && (
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

  if (type === BUSINESS_LAYOUT_CONSTANTS.EXPIRY_WARNING_TYPE.PAST_DUE) {
    return (
      <div
        aria-label={t("layout.expiryWarning.ariaLabel")}
        className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-foreground shadow-2xs"
        role="status"
      >
        <div className="flex items-center gap-1.5 font-medium text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{t("layout.expiryWarning.ariaLabel")}</span>
        </div>

        <p className="text-muted-foreground">{message}</p>

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
