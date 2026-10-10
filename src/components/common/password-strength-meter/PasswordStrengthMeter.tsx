import { Check, X } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import { evaluatePasswordStrength } from "@/shared/domain";
import { cn } from "@/shared/utils/cn";
import {
  PASSWORD_STRENGTH_FILLED_SEGMENTS,
  PASSWORD_STRENGTH_SEGMENT_CLASS_NAME,
  PASSWORD_STRENGTH_SEGMENTS,
} from "./constants/passwordStrengthMeter.constants";
import type { PasswordStrengthMeterProps } from "./models/passwordStrengthMeter.model";

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
      <p className="text-xs font-medium text-foreground" role="status">
        {hasPassword
          ? t("passwordStrength.levelLabel", {
              level: t(`passwordStrength.level.${level}`),
            })
          : t("passwordStrength.emptyLabel")}
      </p>
      <ul className="flex flex-col gap-1">
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
                  ? "passwordStrength.ruleMet"
                  : "passwordStrength.ruleMissing",
              )}
            </span>
            {t(`passwordStrength.rule.${rule.id}`)}
          </li>
        ))}
      </ul>
    </div>
  );
};
