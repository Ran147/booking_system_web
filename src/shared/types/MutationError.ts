import type { ErrorMessageKey } from "@/shared/constants";

export interface MutationError {
  code: string;
  messageKey: ErrorMessageKey;
}
