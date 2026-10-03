export const ROLE_GATE_DECISION = {
  ALLOW: "allow",
  REDIRECT_TO_OWN_PORTAL: "redirect_to_own_portal",
  REDIRECT_TO_SIGN_IN: "redirect_to_sign_in",
  WAIT: "wait",
} as const;

export type RoleGateDecision =
  (typeof ROLE_GATE_DECISION)[keyof typeof ROLE_GATE_DECISION];
