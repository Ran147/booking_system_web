import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/common";

export const AGENDA_DAY_BLOCKS_SIDEBAR_CONFIG = Object.freeze({
  ALL_BLOCKS_LIST_CLASS:
    "flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1",
  DELETE_BUTTON_SIZE: BUTTON_SIZE.SM,
  DELETE_BUTTON_VARIANT: BUTTON_VARIANT.GHOST,
} as const);
