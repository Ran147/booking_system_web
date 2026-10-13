import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Propiedades del atomo InputField.
 */
export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly className?: string;
  /** Control dentro del campo, al final (por ejemplo mostrar / ocultar contraseña). */
  readonly endAdornment?: ReactNode;
  readonly error?: string;
  readonly helperText?: string;
  readonly id?: string;
  readonly inputClassName?: string;
  readonly label?: string;
  readonly name?: string;
  readonly required?: boolean;
}
