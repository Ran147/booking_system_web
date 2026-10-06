import { Check, X } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/utils/cn";
import type { PasswordStrengthMeterProps } from "./models/passwordStrengthMeter.model";

export const PasswordStrengthMeter = ({
  label,
  rules,
  strengthLabel,
}: PasswordStrengthMeterProps): ReactElement => (
  <div aria-live="polite" className="space-y-2">
    <p className="text-sm font-medium text-foreground">
      {label}: {strengthLabel}
    </p>
    <ul className="grid gap-1 text-xs sm:grid-cols-2">
      {rules.map((rule) => {
        const RuleIcon = rule.isMet ? Check : X;

        return (
          <li
            className={cn(
              "flex items-center gap-1.5",
              rule.isMet ? "text-success" : "text-muted-foreground",
            )}
            key={rule.label}
          >
            <RuleIcon aria-hidden="true" className="size-3.5" />
            {rule.label}
          </li>
        );
      })}
    </ul>
  </div>
);
