import type { ComponentProps } from "react";

/**
 * @typedef {Object} PasswordInputProps
 * @property {boolean} isVisible - true muestra la contraseña como texto.
 * @property {() => void} onToggleVisibility - Alterna entre visible y oculta.
 * @property {string} [className] - Clases extra del contenedor.
 *
 * El resto de propiedades (value, onChange, onBlur, ref, id, aria-*) llegan
 * al input, así que funciona dentro de FormControl igual que Input.
 */
export interface PasswordInputProps extends Omit<
  ComponentProps<"input">,
  "type"
> {
  readonly className?: string;
  readonly isVisible: boolean;
  readonly onToggleVisibility: () => void;
}
