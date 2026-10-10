/**
 * Propiedades del atomo PasswordStrengthMeter (KAN-25, KAN-37, KAN-124).
 */
export interface PasswordStrengthMeterProps {
  readonly className?: string;
  /** Id para enlazar el medidor al campo con aria-describedby. */
  readonly id?: string;
  readonly password: string;
}
