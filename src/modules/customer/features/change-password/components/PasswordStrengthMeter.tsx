import { Check, X } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { PASSWORD_RULE } from "../constants";
import type { PasswordStrengthMeterProps } from "../models";

export const PasswordStrengthMeter = ({
  password,
}: PasswordStrengthMeterProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const rules = [
    {
      isMet: password.length >= PASSWORD_RULE.MIN_LENGTH,
      label: t("profile.password.ruleMinLength", {
        count: PASSWORD_RULE.MIN_LENGTH,
      }),
    },
    {
      isMet: PASSWORD_RULE.PATTERN.LOWERCASE.test(password),
      label: t("profile.password.ruleLowercase"),
    },
    {
      isMet: PASSWORD_RULE.PATTERN.UPPERCASE.test(password),
      label: t("profile.password.ruleUppercase"),
    },
    {
      isMet: PASSWORD_RULE.PATTERN.DIGIT.test(password),
      label: t("profile.password.ruleDigit"),
    },
    {
      isMet: PASSWORD_RULE.PATTERN.SYMBOL.test(password),
      label: t("profile.password.ruleSymbol"),
    },
  ];

  return (
    <div aria-live="polite" className="rounded-lg bg-muted/50 p-4">
      <p className="mb-2 text-xs font-semibold text-foreground">
        {t("profile.password.requirementsTitle")}
      </p>
      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {rules.map((rule) => {
          const Icon = rule.isMet ? Check : X;
          return (
            <li
              className={rule.isMet ? "text-primary" : "text-muted-foreground"}
              key={rule.label}
            >
              <span className="flex items-center gap-1.5">
                <Icon aria-hidden="true" className="size-3.5" />
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
