import { Check } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common";
import { I18N_NAMESPACE, LANGUAGE, type Language } from "@/constants";
import type { LanguagePreferenceViewModel } from "../models";

export interface LanguageSelectorProps {
  viewModel: LanguagePreferenceViewModel;
}

export const LanguageSelector = ({
  viewModel,
}: LanguageSelectorProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.COMMON);
  const options: ReadonlyArray<{ label: string; value: Language }> = [
    { label: t("language.spanishLabel"), value: LANGUAGE.ES },
    { label: t("language.englishLabel"), value: LANGUAGE.EN },
  ];

  return (
    <div className="space-y-3">
      <div
        aria-busy={viewModel.isSaving}
        aria-label={t("language.selectorLabel")}
        className="grid gap-3 sm:grid-cols-2"
        role="group"
      >
        {options.map((option) => {
          const isActive = option.value === viewModel.currentLanguage;
          return (
            <Button
              aria-pressed={isActive}
              className="h-auto min-h-12 justify-between px-4 py-3"
              disabled={isActive || viewModel.isSaving}
              key={option.value}
              onClick={() => void viewModel.handleLanguageChange(option.value)}
              rightIcon={isActive ? Check : undefined}
              type="button"
              variant={isActive ? "primary" : "outline"}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
      {viewModel.isSaving ? (
        <p className="text-sm text-muted-foreground" role="status">
          {t("language.savingHint")}
        </p>
      ) : null}
    </div>
  );
};
