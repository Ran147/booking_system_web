import type { TextareaHTMLAttributes } from "react";

/**
 * Propiedades del atomo TextareaField.
 */
export interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly className?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly id?: string;
  readonly label?: string;
  readonly maxLength?: number;
  readonly name?: string;
  readonly required?: boolean;
  readonly rows?: number;
  readonly showCharacterCount?: boolean;
  readonly textareaClassName?: string;
}
