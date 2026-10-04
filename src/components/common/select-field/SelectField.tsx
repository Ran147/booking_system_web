import { forwardRef, useId, type ForwardedRef, type ReactElement } from "react";
import { cn } from "@/utils/cn";
import type { SelectFieldProps } from "./models/selectField.model";

export const SelectField = forwardRef(
  (
    {
      className,
      disabled = false,
      error,
      helperText,
      id,
      label,
      name,
      options,
      placeholder = "Selecciona una opción",
      required = false,
      selectClassName,
      value,
      ...restProperties
    }: SelectFieldProps,
    reference: ForwardedRef<HTMLSelectElement>,
  ): ReactElement => {
    const generatedIdentifier = useId();
    const selectIdentifier = id ?? name ?? generatedIdentifier;
    const errorIdentifier = `${selectIdentifier}-error`;
    const helperIdentifier = `${selectIdentifier}-helper`;

    const descriptionIdentifier = error
      ? errorIdentifier
      : helperText
        ? helperIdentifier
        : undefined;

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", className)}>
        {label && (
          <label
            className="text-xs font-medium tracking-wide text-foreground flex items-center gap-1"
            htmlFor={selectIdentifier}
          >
            {label}
            {required && (
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          <select
            aria-describedby={descriptionIdentifier}
            aria-invalid={Boolean(error)}
            className={cn(
              "w-full px-3.5 py-2 pr-10 rounded-lg bg-background text-foreground text-sm border appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                : "border-border focus:border-primary focus:ring-primary/20",
              selectClassName,
            )}
            disabled={disabled}
            id={selectIdentifier}
            name={name}
            ref={reference}
            required={required}
            value={value}
            {...restProperties}
          >
            {placeholder && (
              <option value="" disabled className="text-muted-foreground">
                {placeholder}
              </option>
            )}
            {options.map((optionItem) => (
              <option
                className="bg-background text-foreground"
                disabled={optionItem.disabled}
                key={optionItem.value}
                value={optionItem.value}
              >
                {optionItem.label}
              </option>
            ))}
          </select>

          {/* Chevron desplegable accesible */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
          >
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 9l-7 7-7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {error ? (
          <p
            className="text-xs text-destructive font-medium mt-0.5"
            id={errorIdentifier}
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            className="text-xs text-muted-foreground mt-0.5"
            id={helperIdentifier}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

SelectField.displayName = "SelectField";
