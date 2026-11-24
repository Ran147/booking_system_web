/**
 * @file Contratos de tipos para los filtros del historial de reservas.
 */

import type { BookingHistoryFilterValues } from "@/modules/business/features/schedule";

/**
 * @typedef {Object} BookingHistoryFiltersProps
 * @property {BookingHistoryFilterValues} filters - Valores de filtro activos.
 * @property {() => void} onClear - Callback para limpiar todos los filtros.
 * @property {(key: keyof BookingHistoryFilterValues, value: BookingHistoryFilterValues[keyof BookingHistoryFilterValues]) => void} onFilterChange - Callback al cambiar un filtro.
 */
export interface BookingHistoryFiltersProps {
  readonly filters: BookingHistoryFilterValues;
  readonly onClear: () => void;
  readonly onFilterChange: <Key extends keyof BookingHistoryFilterValues>(
    key: Key,
    value: BookingHistoryFilterValues[Key],
  ) => void;
}
