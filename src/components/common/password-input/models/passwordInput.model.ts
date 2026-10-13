import type { MouseEvent } from "react";
import type { InputFieldProps } from "@/components/common/input-field/models/inputField.model";

/**
 * Propiedades del atomo PasswordInput: un InputField con el boton mostrar /
 * ocultar dentro del campo. Funciona en dos modos:
 * - Sin `isVisible`: el propio componente guarda si la contraseña se ve.
 * - Con `isVisible` y `onToggleVisibility`: lo controla quien lo usa (por
 *   ejemplo un ViewModel con varios campos).
 *
 * El resto de propiedades (value, onChange, onBlur, ref, id, aria-*) llegan al
 * input, asi que funciona dentro de FormControl igual que InputField.
 */
export interface PasswordInputProps extends Omit<
  InputFieldProps,
  "endAdornment" | "type"
> {
  /** Modo controlado: true muestra la contraseña como texto. */
  readonly isVisible?: boolean;
  /** Modo controlado: alterna entre visible y oculta. */
  readonly onToggleVisibility?: () => void;
  /** Modo sin control: al cambiar este valor la contraseña vuelve a ocultarse (por ejemplo tras enviar el formulario). */
  readonly visibilityResetKey?: number;
}

/**
 * Parametros del hook usePasswordInput.
 */
export type UsePasswordInputParameters = Pick<
  PasswordInputProps,
  "isVisible" | "onToggleVisibility" | "visibilityResetKey"
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
