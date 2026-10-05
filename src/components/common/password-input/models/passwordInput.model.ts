import type { MouseEvent } from "react";
import type { InputFieldProps } from "@/components/common/input-field/models/inputField.model";

/**
 * Propiedades del atomo PasswordInput: un InputField cuyo tipo controla el
 * propio componente (KAN-25, KAN-35, KAN-125).
 */
export type PasswordInputProps = Omit<
  InputFieldProps,
  "trailingElement" | "type"
>;

/**
 * Estado del boton mostrar / ocultar.
 */
export interface UsePasswordInputReturn {
  readonly handleToggleMouseDown: (
    mouseEvent: MouseEvent<HTMLButtonElement>,
  ) => void;
  readonly handleToggleVisibility: () => void;
  readonly isPasswordVisible: boolean;
}
