import { useEffect, useRef } from "react";
import { BROWSER_EVENT } from "@/shared/constants";
import type { NullableRef } from "@/shared/types";

const ACTIVITY_EVENTS = [
  BROWSER_EVENT.KEY_DOWN,
  BROWSER_EVENT.POINTER_DOWN,
  BROWSER_EVENT.SCROLL,
] as const;

export const useIdleTimeout = (
  idleTimeoutMs: number,
  onIdle: () => void,
): void => {
  const timeoutIdRef = useRef<NullableRef<number>>(null);

  useEffect(() => {
    const restartTimer = (): void => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = window.setTimeout(onIdle, idleTimeoutMs);
    };

    restartTimer();
    ACTIVITY_EVENTS.forEach((activityEvent) => {
      window.addEventListener(activityEvent, restartTimer, { passive: true });
    });

    return (): void => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }
      ACTIVITY_EVENTS.forEach((activityEvent) => {
        window.removeEventListener(activityEvent, restartTimer);
      });
    };
  }, [idleTimeoutMs, onIdle]);
};
