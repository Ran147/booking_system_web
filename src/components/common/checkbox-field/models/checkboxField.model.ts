import type { InputHTMLAttributes, ReactNode } from "react";

export interface CheckboxFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  readonly className?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly id?: string;
  readonly label: ReactNode;
  readonly name?: string;
  readonly required?: boolean;
}
