export const VIEW_STATE = {
  EMPTY: "empty",
  ERROR: "error",
  LOADING: "loading",
  READY: "ready",
} as const;

export type ViewState = (typeof VIEW_STATE)[keyof typeof VIEW_STATE];
