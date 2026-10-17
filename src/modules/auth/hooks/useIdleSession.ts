import { useCallback, useEffect, useRef, useState } from "react";
import { BROWSER_EVENT } from "@/constants";
import type { NullableRef } from "@/types";
import { IDLE_SESSION } from "../constants/IdleSession.constants";
import type {
  IdleSession,
  UseIdleSessionParameters,
} from "../models/idleSession.model";

const ACTIVITY_EVENTS = [
  BROWSER_EVENT.KEY_DOWN,
  BROWSER_EVENT.POINTER_DOWN,
  BROWSER_EVENT.SCROLL,
  BROWSER_EVENT.TOUCH_START,
] as const;

/**
 * Reloj de inactividad por marcas de tiempo (US-38, D-2): compara la hora
 * actual con la última actividad, así un equipo dormido o una pestaña en
 * segundo plano no se descuadran (AC-KAN-38-08).
 * @param {UseIdleSessionParameters} parameters
 * @returns {IdleSession}
 */
export const useIdleSession = ({
  idleTimeoutMinutes,
  onExpire,
  onLocalActivity,
}: UseIdleSessionParameters): IdleSession => {
  const [mountedAt] = useState(() => Date.now());
  const lastActivityAtReference = useRef(mountedAt);
  const lastLocalActivityAtReference = useRef(0);
  const isWarningShownReference = useRef(false);
  const onExpireReference = useRef(onExpire);
  const onLocalActivityReference = useRef(onLocalActivity);
  const [remainingWarningSeconds, setRemainingWarningSeconds] =
    useState<NullableRef<number>>(null);

  useEffect(() => {
    onExpireReference.current = onExpire;
    onLocalActivityReference.current = onLocalActivity;
  }, [onExpire, onLocalActivity]);

  const checkIdleTime = useCallback((): void => {
    const limitMs = idleTimeoutMinutes * IDLE_SESSION.MILLISECONDS_PER_MINUTE;
    const elapsedMs = Date.now() - lastActivityAtReference.current;

    // Called on every check while expired: the one that ends the session
    // ignores the repeats and tries again if ending it failed.
    if (elapsedMs >= limitMs) {
      onExpireReference.current();
      return;
    }

    const warningStartMs = Math.max(
      limitMs -
        IDLE_SESSION.WARNING_SECONDS * IDLE_SESSION.MILLISECONDS_PER_SECOND,
      0,
    );
    isWarningShownReference.current = elapsedMs >= warningStartMs;
    setRemainingWarningSeconds(
      elapsedMs >= warningStartMs
        ? Math.ceil(
            (limitMs - elapsedMs) / IDLE_SESSION.MILLISECONDS_PER_SECOND,
          )
        : null,
    );
  }, [idleTimeoutMinutes]);

  const registerActivity = useCallback(
    (activityAt: number = Date.now()): void => {
      lastActivityAtReference.current = Math.max(
        lastActivityAtReference.current,
        activityAt,
      );
      checkIdleTime();
    },
    [checkIdleTime],
  );

  useEffect(() => {
    checkIdleTime();
    const intervalIdentifier = window.setInterval(
      checkIdleTime,
      IDLE_SESSION.TICK_MS,
    );
    // The timers sleep with the device: check as soon as the page is back.
    document.addEventListener(BROWSER_EVENT.VISIBILITY_CHANGE, checkIdleTime);

    return (): void => {
      window.clearInterval(intervalIdentifier);
      document.removeEventListener(
        BROWSER_EVENT.VISIBILITY_CHANGE,
        checkIdleTime,
      );
    };
  }, [checkIdleTime]);

  useEffect(() => {
    const handleActivity = (): void => {
      // While the warning is open only its own actions count: a click on
      // "Sign out" must not close the dialog before it lands (US-38, D-3).
      if (isWarningShownReference.current) return;
      const activityAt = Date.now();
      if (
        activityAt - lastLocalActivityAtReference.current <
        IDLE_SESSION.ACTIVITY_THROTTLE_MS
      ) {
        return;
      }
      lastLocalActivityAtReference.current = activityAt;
      registerActivity(activityAt);
      onLocalActivityReference.current(activityAt);
    };

    ACTIVITY_EVENTS.forEach((activityEvent) => {
      window.addEventListener(activityEvent, handleActivity, { passive: true });
    });

    return (): void => {
      ACTIVITY_EVENTS.forEach((activityEvent) => {
        window.removeEventListener(activityEvent, handleActivity);
      });
    };
  }, [registerActivity]);

  return { registerActivity, remainingWarningSeconds };
};
