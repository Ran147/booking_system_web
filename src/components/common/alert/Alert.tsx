import { forwardRef, type ForwardedRef, type ReactElement } from "react";
import { cn } from "@/utils/cn";
import { ALERT_VARIANT } from "./constants/alert.constants";
import type { AlertProps } from "./models/alert.model";

const variantStyles: Record<string, string> = {
  [ALERT_VARIANT.DESTRUCTIVE]:
    "border-destructive/50 bg-destructive/10 text-destructive",
  [ALERT_VARIANT.WARNING]: "border-warning/50 bg-warning/10 text-foreground",
};

// role="alert" makes screen readers announce the message. tabIndex -1 lets a
// ViewModel move focus to it without adding it to the tab order.
export const Alert = forwardRef(
  (
    {
      children,
      className,
      variant = ALERT_VARIANT.DESTRUCTIVE,
      ...restProperties
    }: AlertProps,
    reference: ForwardedRef<HTMLDivElement>,
  ): ReactElement => (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary",
        variantStyles[variant] ?? variantStyles[ALERT_VARIANT.DESTRUCTIVE],
        className,
      )}
      ref={reference}
      role="alert"
      tabIndex={-1}
      {...restProperties}
    >
      {children}
    </div>
  ),
);

Alert.displayName = "Alert";
