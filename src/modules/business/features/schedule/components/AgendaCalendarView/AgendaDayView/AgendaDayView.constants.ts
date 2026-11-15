import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/common";
import { ARIA_ROLE } from "@/constants";

export const AGENDA_DAY_VIEW_CONFIG = Object.freeze({
  BANNER_ROLE: ARIA_ROLE.STATUS,
  DELETE_BANNER_BUTTON_SIZE: BUTTON_SIZE.SM,
  DELETE_BANNER_BUTTON_VARIANT: BUTTON_VARIANT.OUTLINE,
} as const);

