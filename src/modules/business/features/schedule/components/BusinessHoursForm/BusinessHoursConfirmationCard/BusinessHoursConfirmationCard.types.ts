/**
 * @file Contratos de tipos para la tarjeta de modalidad de confirmación de reservas.
 */

import type { RadioGroupOption } from "@/components/common";
import type { BookingConfirmationMode } from "@/modules/business/features/schedule";

/**
 * @typedef {Object} BusinessHoursConfirmationCardProps
 * @property {BookingConfirmationMode} confirmationMode - Modalidad seleccionada actualmente.
 * @property {readonly RadioGroupOption[]} confirmationOptions - Opciones disponibles para el selector.
 * @property {boolean} isSaving - Indica si hay una actualización en curso.
 * @property {(value: string) => void} onModeChange - Callback al cambiar la modalidad.
 * @property {() => void} onSave - Callback para guardar la preferencia.
 */
export interface BusinessHoursConfirmationCardProps {
  readonly confirmationMode: BookingConfirmationMode;
  readonly confirmationOptions: readonly RadioGroupOption[];
  readonly isSaving: boolean;
  readonly onModeChange: (value: string) => void;
  readonly onSave: () => void;
}

