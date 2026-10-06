/** One password requirement and whether the current value satisfies it. */
export interface PasswordRuleItem {
  readonly isMet: boolean;
  readonly label: string;
}

/** Properties accepted by the reusable password strength presentation. */
export interface PasswordStrengthMeterProps {
  readonly label: string;
  readonly rules: readonly PasswordRuleItem[];
  readonly strengthLabel: string;
}
