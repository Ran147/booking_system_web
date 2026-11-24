import { Plus, Trash2 } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, BUTTON_VARIANT, InputField } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { BUSINESS_HOURS_DAY_ROW_CONFIG } from "./BusinessHoursDayRow.constants";
import type { BusinessHoursDayRowProps } from "./BusinessHoursDayRow.types";

export const BusinessHoursDayRow = ({
  dayRow,
}: BusinessHoursDayRowProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div className="pt-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div className="w-36 flex flex-col gap-1">
        <span className="font-medium text-foreground capitalize">
          {dayRow.day}
        </span>
        <Button
          className="self-start"
          size={BUSINESS_HOURS_DAY_ROW_CONFIG.TOGGLE_BUTTON_SIZE}
          variant={
            dayRow.isOpen ? BUTTON_VARIANT.OUTLINE : BUTTON_VARIANT.GHOST
          }
          onClick={dayRow.onToggleOpen}
        >
          {dayRow.isOpen
            ? t("schedule.hours.openDay")
            : t("schedule.hours.closedDay")}
        </Button>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {dayRow.isOpen ? (
          dayRow.ranges.map((range) => (
            <div className="flex items-center gap-3" key={range.id}>
              <div className="w-32">
                <InputField
                  label={t("schedule.hours.from")}
                  type={BUSINESS_HOURS_DAY_ROW_CONFIG.TIME_INPUT_TYPE}
                  value={range.opensAt}
                  onChange={range.onOpensAtChange}
                />
              </div>
              <div className="w-32">
                <InputField
                  label={t("schedule.hours.to")}
                  type={BUSINESS_HOURS_DAY_ROW_CONFIG.TIME_INPUT_TYPE}
                  value={range.closesAt}
                  onChange={range.onClosesAtChange}
                />
              </div>

              {dayRow.canRemoveRange && (
                <div className="mt-5">
                  <Button
                    ariaLabel={t("schedule.hours.removeRange")}
                    size={
                      BUSINESS_HOURS_DAY_ROW_CONFIG.REMOVE_RANGE_BUTTON_SIZE
                    }
                    variant={BUTTON_VARIANT.GHOST}
                    onClick={range.onRemove}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <span className="text-sm text-muted-foreground italic py-2">
            {t("schedule.hours.closedDay")}
          </span>
        )}

        {dayRow.canAddRange && (
          <Button
            className="self-start"
            leftIcon={Plus}
            size={BUSINESS_HOURS_DAY_ROW_CONFIG.ADD_RANGE_BUTTON_SIZE}
            variant={BUTTON_VARIANT.GHOST}
            onClick={dayRow.onAddRange}
          >
            {t("schedule.hours.addRange")}
          </Button>
        )}
      </div>
    </div>
  );
};
