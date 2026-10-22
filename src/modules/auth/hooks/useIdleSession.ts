import { useCallback, useEffect, useRef, useState } from "react";
import { BROWSER_EVENT, STORAGE_KEY } from "@/constants";
import { auth } from "@/services/firebase";
import type { Nullable, NullableRef } from "@/types";
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

const getStoredActivityTime = (): Nullable<number> => {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  try {
    const storedValue = window.localStorage.getItem(
      STORAGE_KEY.LAST_ACTIVITY_AT,
    );
    if (!storedValue) return null;
    const parsedTimestamp = Number(storedValue);
    return Number.isFinite(parsedTimestamp) && parsedTimestamp > 0
      ? parsedTimestamp
      : null;
  } catch {
    return null;
  }
};

const getInitialActivityTime = (): number => {
  const currentTime = Date.now();
  const storedTimestamp = getStoredActivityTime();
  const lastSignInTimestamp = auth.currentUser?.metadata?.lastSignInTime
    ? new Date(auth.currentUser.metadata.lastSignInTime).getTime()
    : null;

  const validStoredTimestamp =
    typeof storedTimestamp === "number" &&
    Number.isFinite(storedTimestamp) &&
    storedTimestamp <= currentTime
      ? storedTimestamp
      : null;

  const validLastSignInTimestamp =
    typeof lastSignInTimestamp === "number" &&
    Number.isFinite(lastSignInTimestamp) &&
    lastSignInTimestamp <= currentTime
      ? lastSignInTimestamp
      : null;

  if (validStoredTimestamp !== null && validLastSignInTimestamp !== null) {
    return Math.max(validStoredTimestamp, validLastSignInTimestamp);
  }
  if (validStoredTimestamp !== null) return validStoredTimestamp;
  if (validLastSignInTimestamp !== null) return validLastSignInTimestamp;
  return currentTime;
};

/**
 * Reloj de inactividad por marcas de tiempo (US-38, D-2): compara la hora
 * actual con la última actividad persistida, así un equipo dormido, una pestaña
 * en segundo plano o una sesión reabierta tras horas no se descuadran (AC-KAN-38-08).
 * @param {UseIdleSessionParameters} parameters
 * @returns {IdleSession}
 */
export const useIdleSession = ({
  idleTimeoutMinutes,
  onExpire,
  onLocalActivity,
}: UseIdleSessionParameters): IdleSession => {
  const [initialActivityTime] = useState(getInitialActivityTime);
  const lastActivityAtReference = useRef(initialActivityTime);
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
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem(
            STORAGE_KEY.LAST_ACTIVITY_AT,
            String(lastActivityAtReference.current),
          );
        } catch {
          // Local storage write failures ignored
        }
      }
      checkIdleTime();
    },
    [checkIdleTime],
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const existingStored = window.localStorage.getItem(
          STORAGE_KEY.LAST_ACTIVITY_AT,
        );
        if (!existingStored) {
          window.localStorage.setItem(
            STORAGE_KEY.LAST_ACTIVITY_AT,
            String(lastActivityAtReference.current),
          );
        }
      } catch {
        // Local storage write failures ignored
      }
    }
  }, []);

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
    const handleStorageChange = (storageEvent: StorageEvent): void => {
      if (storageEvent.key === STORAGE_KEY.LAST_ACTIVITY_AT) {
        if (!storageEvent.newValue) return;
        const remoteActivityAt = Number(storageEvent.newValue);
        if (
          Number.isFinite(remoteActivityAt) &&
          remoteActivityAt > 0 &&
          remoteActivityAt <= Date.now()
        ) {
          lastActivityAtReference.current = Math.max(
            lastActivityAtReference.current,
            remoteActivityAt,
          );
          checkIdleTime();
        }
      }
    };

    window.addEventListener(BROWSER_EVENT.STORAGE, handleStorageChange);
    return (): void => {
      window.removeEventListener(BROWSER_EVENT.STORAGE, handleStorageChange);
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
