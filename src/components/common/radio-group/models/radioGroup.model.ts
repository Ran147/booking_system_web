/** Option rendered by the shared accessible radio group. */
export interface RadioGroupOption {
  readonly description?: string;
  readonly label: string;
  readonly value: string;
}

/** Properties accepted by the shared accessible radio group. */
export interface RadioGroupProps {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onValueChange: (nextValue: string) => void;
  readonly options: readonly RadioGroupOption[];
  readonly value: string;
}
