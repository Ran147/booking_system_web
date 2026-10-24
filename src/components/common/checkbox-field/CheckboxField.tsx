import { forwardRef, useId, type ForwardedRef, type ReactElement } from "react";
import { cn } from "@/utils/cn";
import type { CheckboxFieldProps } from "./models/checkboxField.model";

export const CheckboxField = forwardRef(
  (
    {
      checked,
      className,
      disabled = false,
      error,
      helperText,
      id,
      label,
      name,
      onChange,
      required = false,
      ...restProperties
    }: CheckboxFieldProps,
    reference: ForwardedRef<HTMLInputElement>,
  ): ReactElement => {
    const generatedIdentifier = useId();
    const inputIdentifier = id ?? name ?? generatedIdentifier;
    const errorIdentifier = `${inputIdentifier}-error`;
    const helperIdentifier = `${inputIdentifier}-helper`;

    const descriptionIdentifier = error
      ? errorIdentifier
      : helperText
        ? helperIdentifier
        : undefined;

    return (
      <div className={cn("flex flex-col gap-1 w-full", className)}>
        <div className="flex items-start gap-2.5">
          <input
            aria-describedby={descriptionIdentifier}
            aria-invalid={Boolean(error)}
            checked={checked}
            className={cn(
              "size-4 mt-0.5 rounded border border-border bg-background text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              error ? "border-destructive focus:ring-destructive/20" : null,
            )}
            disabled={disabled}
            id={inputIdentifier}
            name={name}
            onChange={onChange}
            ref={reference}
            required={required}
            type="checkbox"
            {...restProperties}
          />
          <label
            className="text-sm text-foreground select-none cursor-pointer leading-tight flex-1"
            htmlFor={inputIdentifier}
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        </div>

        {error ? (
          <p
            className="text-xs text-destructive font-medium mt-0.5 ml-6"
            id={errorIdentifier}
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            className="text-xs text-muted-foreground mt-0.5 ml-6"
            id={helperIdentifier}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

CheckboxField.displayName = "CheckboxField";
