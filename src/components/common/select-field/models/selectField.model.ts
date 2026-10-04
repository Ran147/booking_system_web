import type { SelectHTMLAttributes } from "react";

export interface SelectFieldOption {
  readonly disabled?: boolean;
  readonly label: string;
  readonly value: string;
}

/**
 * Propiedades del atomo SelectField.
 */
export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly className?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly id?: string;
  readonly label?: string;
  readonly name?: string;
  readonly options: readonly SelectFieldOption[];
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly selectClassName?: string;
}
