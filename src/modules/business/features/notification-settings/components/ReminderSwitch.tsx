import type { ButtonHTMLAttributes, ReactElement } from "react";
import { Button } from "@/components/common";
import { cn } from "@/utils/cn";

interface ReminderSwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}
export const ReminderSwitch = ({
  checked,
  className,
  disabled,
  onCheckedChange,
  ...properties
}: ReminderSwitchProps): ReactElement => (
  <Button
    aria-checked={checked}
    className={cn(
      "relative h-7 w-12 min-w-12 rounded-full border-0 p-0",
      checked ? "bg-primary" : "bg-muted",
      className,
    )}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    role="switch"
    type="button"
    variant="ghost"
    {...properties}
  >
    <span
      className={cn(
        "pointer-events-none block size-5 rounded-full bg-background shadow-sm transition-transform",
        checked ? "translate-x-6" : "translate-x-1",
      )}
    />
  </Button>
);
