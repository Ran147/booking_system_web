import type { InputHTMLAttributes, ReactNode } from "react";

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
  /** Control shown inside the field, at its end (for example show / hide password). */
  readonly trailingElement?: ReactNode;
}
