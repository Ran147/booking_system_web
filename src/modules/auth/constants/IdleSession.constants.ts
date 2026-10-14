// Timing of the inactivity sign-out (US-38, D-2, D-3, D-6).
export const IDLE_SESSION = Object.freeze({
  ACTIVITY_THROTTLE_MS: 1_000,
  // The countdown is announced to screen readers every 10 seconds, and every
  // second during the last 5 (US-38, D-7).
  ANNOUNCE_EACH_SECOND_BELOW: 5,
  ANNOUNCE_EVERY_SECONDS: 10,
  CHANNEL_NAME: "booking-idle",
  MILLISECONDS_PER_MINUTE: 60_000,
  MILLISECONDS_PER_SECOND: 1_000,
  REMOTE_ACTIVITY_THROTTLE_MS: 5_000,
  TICK_MS: 1_000,
  // AS-4: the warning appears 60 seconds before the sign-out.
  WARNING_SECONDS: 60,
} as const);

// Messages exchanged between the tabs of one browser (AS-5).
export const IDLE_MESSAGE_TYPE = Object.freeze({
  ACTIVITY: "activity",
  SIGNED_OUT: "signed-out",
} as const);

export type IdleMessageType =
  (typeof IDLE_MESSAGE_TYPE)[keyof typeof IDLE_MESSAGE_TYPE];

// Why the user was sent to sign-in; carried in the router state, never in the URL.
export const SIGN_OUT_REASON = Object.freeze({
  IDLE: "idle",
} as const);

export type SignOutReason =
  (typeof SIGN_OUT_REASON)[keyof typeof SIGN_OUT_REASON];
