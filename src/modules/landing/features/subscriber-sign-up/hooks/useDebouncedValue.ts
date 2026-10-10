import { useEffect, useState } from "react";

// The value as it was delayMs after it last changed.
export const useDebouncedValue = <Value>(
  value: Value,
  delayMs: number,
): Value => {
  const [debouncedValue, setDebouncedValue] = useState<Value>(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return (): void => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, value]);

  return debouncedValue;
};
