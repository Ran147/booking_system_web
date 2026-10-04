import type { ChangeEvent } from "react";

export interface UseSearchInputReturn {
  draftValue: string;
  handleDraftChange: (changeEvent: ChangeEvent<HTMLInputElement>) => void;
}
