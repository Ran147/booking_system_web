import { useEffect, useState, type ChangeEvent } from "react";
import { TIME_MS } from "@/shared/constants";
import type { UseSearchInputReturn } from "./UseSearchInputReturn.interface";

// Keeps what the person types and reports it after the search debounce, so a
// list query does not run on every keystroke.
export const useSearchInput = (
  value: string,
  onValueChange: (nextValue: string) => void,
): UseSearchInputReturn => {
  const [draftValue, setDraftValue] = useState<string>(value);
  const [previousValue, setPreviousValue] = useState<string>(value);

  if (previousValue !== value) {
    setPreviousValue(value);
    setDraftValue(value);
  }

  useEffect(() => {
    if (draftValue === value) return undefined;

    const timeoutId = window.setTimeout(() => {
      onValueChange(draftValue);
    }, TIME_MS.DEBOUNCE.SEARCH);

    return (): void => {
      window.clearTimeout(timeoutId);
    };
  }, [draftValue, onValueChange, value]);

  return {
    draftValue,
    handleDraftChange: (changeEvent: ChangeEvent<HTMLInputElement>): void => {
      setDraftValue(changeEvent.target.value);
    },
  };
};
