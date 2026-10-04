export const APP_LINK_VARIANT = {
  BUTTON: "button",
  TEXT: "text",
} as const;

export type AppLinkVariant =
  (typeof APP_LINK_VARIANT)[keyof typeof APP_LINK_VARIANT];
