import { useCallback, useEffect, useRef } from "react";
import type { Nullable } from "@/types";
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
    };
  }, []);

  const broadcastActivity = useCallback((activityAt: number): void => {
    if (
      activityAt - lastBroadcastAtReference.current <
      IDLE_SESSION.REMOTE_ACTIVITY_THROTTLE_MS
    ) {
      return;
    }
    lastBroadcastAtReference.current = activityAt;
    channelReference.current?.postMessage({
      activityAt,
      type: IDLE_MESSAGE_TYPE.ACTIVITY,
    } satisfies IdleMessage);
  }, []);

  const broadcastSignedOut = useCallback((): void => {
    channelReference.current?.postMessage({
      type: IDLE_MESSAGE_TYPE.SIGNED_OUT,
    } satisfies IdleMessage);
  }, []);

  return { broadcastActivity, broadcastSignedOut };
};
