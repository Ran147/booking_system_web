import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { RadioGroup } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { AvailableSlot } from "@/modules/customer/features/availability";
import { formatTime } from "@/utils";

export interface SlotListProps {
  readonly language: string;
  readonly onSelectSlot: (startsAt: string) => void;
  readonly selectedSlotStartsAt: string;
  readonly slots: readonly AvailableSlot[];
  readonly timeZone: string;
}

/**
 * Free slots as a single-choice group, with times in the business time zone
 * (AC-KAN-140-06). Who would serve a slot is never shown (AC-KAN-142-02).
 */
export const SlotList = ({
  language,
  onSelectSlot,
  selectedSlotStartsAt,
  slots,
  timeZone,
}: SlotListProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);

  return (
    <RadioGroup
      label={t("availability.slots.groupLabel")}
      onValueChange={onSelectSlot}
      options={slots.map((slot) => ({
        label: formatTime(new Date(slot.startsAt), timeZone, language),
        value: slot.startsAt,
      }))}
      value={selectedSlotStartsAt}
    />
  );
};
