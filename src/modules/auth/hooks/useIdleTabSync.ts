import { useCallback, useEffect, useRef } from "react";
import type { Nullable, NullableRef } from "@/types";
import {
  IDLE_MESSAGE_TYPE,
  IDLE_SESSION,
} from "../constants/IdleSession.constants";
import type { IdleMessage, IdleTabSync } from "../models/idleSession.model";

interface UseIdleTabSyncParameters {
  readonly onRemoteActivity: (activityAt: number) => void;
  readonly onRemoteSignedOut: () => void;
}

const isIdleMessage = (message: unknown): message is IdleMessage =>
  typeof message === "object" &&
  message !== null &&
  "type" in message &&
  (message.type === IDLE_MESSAGE_TYPE.ACTIVITY ||
    message.type === IDLE_MESSAGE_TYPE.SIGNED_OUT);

/**
 * Comparte la actividad y el cierre de sesión entre las pestañas del mismo
 * navegador con un BroadcastChannel (US-38, D-6, AS-5).
 * @param {UseIdleTabSyncParameters} parameters
 * @returns {IdleTabSync}
 */
export const useIdleTabSync = ({
  onRemoteActivity,
  onRemoteSignedOut,
}: UseIdleTabSyncParameters): IdleTabSync => {
  const channelReference = useRef<Nullable<BroadcastChannel>>(null);
  const lastBroadcastAtReference = useRef(0);
  const pendingActivityAtReference = useRef<NullableRef<number>>(null);
  const trailingTimerReference = useRef<NullableRef<number>>(null);
  const onRemoteActivityReference = useRef(onRemoteActivity);
  const onRemoteSignedOutReference = useRef(onRemoteSignedOut);

  useEffect(() => {
    onRemoteActivityReference.current = onRemoteActivity;
    onRemoteSignedOutReference.current = onRemoteSignedOut;
  }, [onRemoteActivity, onRemoteSignedOut]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return undefined;

    const channel = new BroadcastChannel(IDLE_SESSION.CHANNEL_NAME);
    channel.onmessage = (messageEvent: MessageEvent<unknown>): void => {
      if (!isIdleMessage(messageEvent.data)) return;
      if (messageEvent.data.type === IDLE_MESSAGE_TYPE.SIGNED_OUT) {
        onRemoteSignedOutReference.current();
        return;
      }
      onRemoteActivityReference.current(
        messageEvent.data.activityAt ?? Date.now(),
      );
    };
    channelReference.current = channel;

    return (): void => {
      channel.close();
      channelReference.current = null;
      if (trailingTimerReference.current !== null) {
        window.clearTimeout(trailingTimerReference.current);
        trailingTimerReference.current = null;
      }
    };
  }, []);

  const postActivity = useCallback((activityAt: number): void => {
    lastBroadcastAtReference.current = activityAt;
    channelReference.current?.postMessage({
      activityAt,
      type: IDLE_MESSAGE_TYPE.ACTIVITY,
    } satisfies IdleMessage);
  }, []);

  const clearTrailingBroadcast = useCallback((): void => {
    pendingActivityAtReference.current = null;
    if (trailingTimerReference.current !== null) {
      window.clearTimeout(trailingTimerReference.current);
      trailingTimerReference.current = null;
    }
  }, []);

  // At most one message every REMOTE_ACTIVITY_THROTTLE_MS, but the last
  // activity of the interval is sent when it ends: otherwise the other tabs
  // would count from an activity older than the real one.
  const broadcastActivity = useCallback(
    (activityAt: number): void => {
      const elapsedMs = activityAt - lastBroadcastAtReference.current;
      if (elapsedMs >= IDLE_SESSION.REMOTE_ACTIVITY_THROTTLE_MS) {
        clearTrailingBroadcast();
        postActivity(activityAt);
        return;
      }

      pendingActivityAtReference.current = activityAt;
      if (trailingTimerReference.current !== null) return;
      trailingTimerReference.current = window.setTimeout(() => {
        const pendingActivityAt = pendingActivityAtReference.current;
        clearTrailingBroadcast();
        if (pendingActivityAt !== null) postActivity(pendingActivityAt);
      }, IDLE_SESSION.REMOTE_ACTIVITY_THROTTLE_MS - elapsedMs);
    },
    [clearTrailingBroadcast, postActivity],
  );

  // "Stay connected" must reach the other tabs at once: they may be counting
  // down to the same sign-out (AC-KAN-38-06).
  const broadcastActivityNow = useCallback(
    (activityAt: number): void => {
      clearTrailingBroadcast();
      postActivity(activityAt);
    },
    [clearTrailingBroadcast, postActivity],
  );

  const broadcastSignedOut = useCallback((): void => {
    channelReference.current?.postMessage({
      type: IDLE_MESSAGE_TYPE.SIGNED_OUT,
    } satisfies IdleMessage);
  }, []);

  return { broadcastActivity, broadcastActivityNow, broadcastSignedOut };
};
