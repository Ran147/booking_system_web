import type { InputHTMLAttributes } from "react";

/**
 * Propiedades del atomo InputField.
 */
export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly className?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly id?: string;
  readonly inputClassName?: string;
  readonly label?: string;
  readonly name?: string;
  readonly required?: boolean;
}
