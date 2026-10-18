import {
  VALIDATION_MESSAGE_KEY,
  type ValidationMessageKey,
} from "@/shared/constants";
import type { Nullable } from "@/shared/types";

// Schemas store VALIDATION_MESSAGE_KEY values as error messages; this narrows
// a message to one of those keys before translating it.
export const isValidationMessageKey = (
  message: Nullable<string>,
): message is ValidationMessageKey =>
  Object.values(VALIDATION_MESSAGE_KEY).some(
    (messageKey) => messageKey === message,
  );
