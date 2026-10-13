/**
 * Propiedades del atomo PasswordStrengthMeter. Solo recibe la contraseña: las
 * reglas y el nivel salen de evaluatePasswordStrength (@/domain), las mismas
 * que usan los esquemas de validacion.
 */
export interface PasswordStrengthMeterProps {
  readonly className?: string;
  /** Id para enlazar el medidor al campo con aria-describedby. */
  readonly id?: string;
  readonly password: string;
}
