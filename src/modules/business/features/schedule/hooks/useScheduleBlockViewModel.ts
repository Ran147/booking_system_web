import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE, STRING } from "@/constants";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { parseZonedDateTime, zonedDayBounds } from "@/utils/date";
import { useScheduleBlockMutations, useScheduleBlocksQuery } from "../api";
import { SCHEDULE_BLOCK_DEFAULT_TIME, SCHEDULE_CONSTANTS } from "../constants";
import type { ScheduleBlock, ScheduleBlockFormData } from "../models";

export interface ScheduleBlockViewModelResult {
  readonly blocks: readonly ScheduleBlock[];
  readonly closeDialog: () => void;
  readonly errorMessage: Nullable<string>;
  readonly formData: ScheduleBlockFormData;
  readonly handleDeleteBlock: (block: ScheduleBlock) => Promise<void>;
  readonly isCreating: boolean;
  readonly isDeleting: boolean;
  readonly isDialogOpen: boolean;
  readonly isLoading: boolean;
  readonly openDialog: () => void;
  readonly showOverlapConfirm: boolean;
  readonly submitBlock: (forceOverlap?: boolean) => Promise<boolean>;
  readonly updateFormField: <Key extends keyof ScheduleBlockFormData>(
    field: Key,
    value: ScheduleBlockFormData[Key],
  ) => void;
}

const getTodayIso = (): string =>
  new Intl.DateTimeFormat(SCHEDULE_CONSTANTS.ISO_DATE_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    timeZone: SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
    year: "numeric",
  }).format(new Date());

const createInitialBlockFormData = (): ScheduleBlockFormData => ({
  collaboratorId: null,
  endDate: getTodayIso(),
  endTime: SCHEDULE_BLOCK_DEFAULT_TIME.DEFAULT_END_TIME,
  isFullDay: false,
  reason: STRING.EMPTY,
  startDate: getTodayIso(),
  startTime: SCHEDULE_BLOCK_DEFAULT_TIME.DEFAULT_START_TIME,
});

export const useScheduleBlockViewModel = (
  onBlockCreated?: (startsAt: Date) => void,
): ScheduleBlockViewModelResult => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const { businessId } = useCurrentBusiness();

  const blocksQuery = useScheduleBlocksQuery(businessId);
  const { createBlock, deleteBlock, isCreating, isDeleting } =
    useScheduleBlockMutations();

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<ScheduleBlockFormData>(
    createInitialBlockFormData,
  );
  const [errorMessage, setErrorMessage] = useState<Nullable<string>>(null);
  const [showOverlapConfirm, setShowOverlapConfirm] = useState<boolean>(false);

  const openDialog = (): void => {
    setFormData(createInitialBlockFormData());
    setErrorMessage(null);
    setShowOverlapConfirm(false);
    setIsDialogOpen(true);
  };

  const closeDialog = (): void => {
    setIsDialogOpen(false);
    setShowOverlapConfirm(false);
    setErrorMessage(null);
  };

  const updateFormField = <Key extends keyof ScheduleBlockFormData>(
    field: Key,
    value: ScheduleBlockFormData[Key],
  ): void => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const submitBlock = async (): Promise<boolean> => {
    setErrorMessage(null);

    if (formData.isFullDay) {
      if (!formData.startDate || !formData.endDate) {
        setErrorMessage(t("schedule.blocks.invalidRangeError"));
        return false;
      }
      if (formData.startDate > formData.endDate) {
        setErrorMessage(t("schedule.blocks.invalidRangeError"));
        return false;
      }
    } else {
      if (!formData.startTime || !formData.endTime) {
        setErrorMessage(t("schedule.blocks.invalidRangeError"));
        return false;
      }
      const startDateTime = `${formData.startDate}T${formData.startTime}`;
      const endDateTime = `${formData.endDate}T${formData.endTime}`;
      if (startDateTime >= endDateTime) {
        setErrorMessage(t("schedule.blocks.invalidRangeError"));
        return false;
      }
    }

    let startsAt: Date;
    let endsAt: Date;

    if (formData.isFullDay) {
      const { start } = zonedDayBounds(
        formData.startDate,
        SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
      );
      const { end } = zonedDayBounds(
        formData.endDate,
        SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
      );
      startsAt = start;
      endsAt = end;
    } else {
      startsAt = parseZonedDateTime(
        formData.startDate,
        formData.startTime || SCHEDULE_BLOCK_DEFAULT_TIME.FALLBACK_START_TIME,
        SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
      );
      endsAt = parseZonedDateTime(
        formData.endDate,
        formData.endTime || SCHEDULE_BLOCK_DEFAULT_TIME.FALLBACK_END_TIME,
        SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
      );
    }

    try {
      await createBlock({
        businessId,
        collaboratorId: formData.collaboratorId ?? null,
        endsAt,
        isFullDay: formData.isFullDay,
        reason: formData.reason || null,
        startsAt,
      });

      onBlockCreated?.(startsAt);
      closeDialog();
      return true;
    } catch {
      setErrorMessage(t("common:errors.network"));
      return false;
    }
  };

  const handleDeleteBlock = async (block: ScheduleBlock): Promise<void> => {
    try {
      await deleteBlock({
        blockId: block.id,
        businessId,
      });
    } catch {
      // Query invalidation handles refresh on error
    }
  };

  return {
    blocks: blocksQuery.data ?? [],
    closeDialog,
    errorMessage,
    formData,
    handleDeleteBlock,
    isCreating,
    isDeleting,
    isDialogOpen,
    isLoading: blocksQuery.isLoading,
    openDialog,
    showOverlapConfirm,
    submitBlock,
    updateFormField,
  };
};
