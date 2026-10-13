import { Check, X } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ARIA_ROLE, I18N_NAMESPACE } from "@/constants";
import { evaluatePasswordStrength, PASSWORD_RULE } from "@/domain";
import { cn } from "@/utils/cn";
import {
  PASSWORD_STRENGTH_FILLED_SEGMENTS,
  PASSWORD_STRENGTH_SEGMENT_CLASS_NAME,
  PASSWORD_STRENGTH_SEGMENTS,
} from "./constants/passwordStrengthMeter.constants";
import type { PasswordStrengthMeterProps } from "./models/passwordStrengthMeter.model";

// Shared by sign-up (KAN-25), change password (KAN-53, HU-171) and password
// recovery.
export const PasswordStrengthMeter = ({
  className,
  id,
  password,
}: PasswordStrengthMeterProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.COMMON);
  const { level, rules } = evaluatePasswordStrength(password);
  const filledSegments = PASSWORD_STRENGTH_FILLED_SEGMENTS[level];
  const hasPassword = password.length > 0;

  return (
    <div className={cn("flex flex-col gap-2", className)} id={id}>
      <div aria-hidden="true" className="flex gap-1">
        {PASSWORD_STRENGTH_SEGMENTS.map((segment) => (
          <span
            className={cn(
              "h-1.5 flex-1 rounded-full bg-muted",
              hasPassword &&
                segment <= filledSegments &&
                PASSWORD_STRENGTH_SEGMENT_CLASS_NAME[level],
            )}
            key={segment}
          />
        ))}
      </div>
      <p
        className="text-xs font-medium text-foreground"
        role={ARIA_ROLE.STATUS}
      >
        {hasPassword
          ? t("auth.password.strengthLabel", {
              level: t(`auth.password.strength.${level}`),
            })
          : t("auth.password.strengthEmpty")}
      </p>
      <ul className="grid gap-1 sm:grid-cols-2">
        {rules.map((rule) => (
          <li
            className={cn(
              "flex items-center gap-1.5 text-xs",
              rule.isMet ? "text-foreground" : "text-muted-foreground",
            )}
            key={rule.id}
          >
            {rule.isMet ? (
              <Check aria-hidden="true" className="size-3.5 text-success" />
            ) : (
              <X aria-hidden="true" className="size-3.5" />
            )}
            <span className="sr-only">
              {t(
                rule.isMet
                  ? "auth.password.ruleMet"
                  : "auth.password.ruleMissing",
              )}
            </span>
            {t(`auth.password.rules.${rule.id}`, {
              count: PASSWORD_RULE.MIN_LENGTH,
            })}
          </li>
        ))}
      </ul>
    </div>
  );
};
