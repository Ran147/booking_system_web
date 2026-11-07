import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { useScheduleBlockMutations, useScheduleBlocksQuery } from "../api";
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

const getTodayIso = (): string => new Date().toISOString().split("T")[0] ?? "";

export const useScheduleBlockViewModel = (): ScheduleBlockViewModelResult => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const { businessId } = useCurrentBusiness();

  const blocksQuery = useScheduleBlocksQuery(businessId);
  const { createBlock, deleteBlock, isCreating, isDeleting } =
    useScheduleBlockMutations();

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<ScheduleBlockFormData>({
    collaboratorId: null,
    endDate: getTodayIso(),
    endTime: "13:00",
    isFullDay: false,
    reason: "",
    startDate: getTodayIso(),
    startTime: "12:00",
  });
  const [errorMessage, setErrorMessage] = useState<Nullable<string>>(null);
  const [showOverlapConfirm, setShowOverlapConfirm] = useState<boolean>(false);

  const openDialog = (): void => {
    setFormData({
      collaboratorId: null,
      endDate: getTodayIso(),
      endTime: "13:00",
      isFullDay: false,
      reason: "",
      startDate: getTodayIso(),
      startTime: "12:00",
    });
    setErrorMessage(null);
    setShowOverlapConfirm(false);
    setIsDialogOpen(true);
  };

  const closeDialog = (): void => {
    setIsDialogOpen(false);
    setShowOverlapConfirm(false);
    setErrorMessage(null);
  };

  const updateFormField = <K extends keyof ScheduleBlockFormData>(
    field: K,
    value: ScheduleBlockFormData[K],
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

    // Determine start and end Date objects
    let startsAt: Date;
    let endsAt: Date;

    if (formData.isFullDay) {
      startsAt = new Date(`${formData.startDate}T00:00:00`);
      endsAt = new Date(`${formData.endDate}T23:59:59.999`);
    } else {
      startsAt = new Date(`${formData.startDate}T${formData.startTime}:00`);
      endsAt = new Date(`${formData.endDate}T${formData.endTime}:00`);
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

      closeDialog();
      return true;
    } catch {
      setErrorMessage(
        t("errors.common.network", { defaultValue: "Error de red" }),
      );
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
      // Invalidate handles refresh
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
