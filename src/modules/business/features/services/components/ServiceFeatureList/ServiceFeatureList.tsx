import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, InputField } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { SERVICE_FEATURE_LIMIT } from "@/modules/business/features/services";
import type { ServiceFeatureListProps } from "./types";

export const ServiceFeatureList = ({
  canAddFeature,
  disabled = false,
  features,
  onAddFeature,
  onFeatureChange,
  onMoveDown,
  onMoveUp,
  onRemoveFeature,
}: ServiceFeatureListProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-xs font-medium tracking-wide text-foreground">
            {t("services.form.featuresTitle")}
          </label>
          <p className="text-xs text-muted-foreground">
            {t("services.form.featuresDescription")}
          </p>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {features.length} / {SERVICE_FEATURE_LIMIT.MAX_ITEMS}
        </span>
      </div>

      {features.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {features.map((featureItem, index) => {
            const isFirst = index === 0;
            const isLast = index === features.length - 1;

            return (
              <div
                className="flex items-center gap-2"
                key={`feature-row-${index}`}
              >
                <div className="flex-1">
                  <InputField
                    aria-label={t("services.form.featureItemLabel", {
                      index: index + 1,
                    })}
                    disabled={disabled}
                    maxLength={SERVICE_FEATURE_LIMIT.ITEM_MAX_LENGTH}
                    onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                      onFeatureChange(index, event.target.value);
                    }}
                    placeholder={t("services.form.featurePlaceholder")}
                    value={featureItem}
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    ariaLabel={t("services.form.moveFeatureUpAction")}
                    disabled={disabled || isFirst}
                    leftIcon={ArrowUp}
                    onClick={(): void => onMoveUp(index)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  />
                  <Button
                    ariaLabel={t("services.form.moveFeatureDownAction")}
                    disabled={disabled || isLast}
                    leftIcon={ArrowDown}
                    onClick={(): void => onMoveDown(index)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  />
                  <Button
                    ariaLabel={t("services.form.removeFeatureAction")}
                    disabled={disabled}
                    leftIcon={Trash2}
                    onClick={(): void => onRemoveFeature(index)}
                    size="sm"
                    type="button"
                    variant="destructive"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <Button
          disabled={disabled || !canAddFeature}
          leftIcon={Plus}
          onClick={onAddFeature}
          size="sm"
          type="button"
          variant="outline"
        >
          {t("services.form.addFeatureAction")}
        </Button>
      </div>
    </div>
  );
};
