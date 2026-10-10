import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "@/utils/cn";

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch = ({
  checked,
  className,
  disabled,
  onCheckedChange,
  ...properties
}: SwitchProps): ReactElement => (
  <button
    aria-checked={checked}
    className={cn(
      "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-primary" : "bg-muted",
      className,
    )}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    role="switch"
    type="button"
    {...properties}
  >
    <span
      className={cn(
        "pointer-events-none block size-5 rounded-full bg-background shadow-sm transition-transform",
        checked ? "translate-x-6" : "translate-x-1",
      )}
    />
  </button>
);
