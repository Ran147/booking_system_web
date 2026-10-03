export const ERROR_MESSAGE_KEY = {
  NETWORK: "errors.network",
  NOT_FOUND: "errors.notFound",
  PERMISSION_DENIED: "errors.permissionDenied",
  UNKNOWN: "errors.unknown",
} as const;

export type ErrorMessageKey =
  (typeof ERROR_MESSAGE_KEY)[keyof typeof ERROR_MESSAGE_KEY];
