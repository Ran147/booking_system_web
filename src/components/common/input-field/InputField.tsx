import { forwardRef, useId, type ForwardedRef, type ReactElement } from "react";
import { cn } from "@/utils/cn";
import type { InputFieldProps } from "./models/inputField.model";

export const InputField = forwardRef(
  (
    {
      autoComplete,
      className,
      disabled = false,
      error,
      helperText,
      id,
      inputClassName,
      label,
      name,
      placeholder,
      required = false,
      trailingElement,
      type = "text",
      ...restProperties
    }: InputFieldProps,
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
      <div className={cn("flex flex-col gap-1.5 w-full", className)}>
        {label && (
          <label
            className="text-xs font-medium tracking-wide text-foreground flex items-center gap-1"
            htmlFor={inputIdentifier}
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
          <input
            aria-describedby={descriptionIdentifier}
            aria-invalid={Boolean(error)}
            autoComplete={autoComplete}
            className={cn(
              "w-full px-3.5 py-2 rounded-lg bg-background text-foreground text-sm border transition-colors duration-200 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                : "border-border focus:border-primary focus:ring-primary/20",
              trailingElement && "pr-11",
              inputClassName,
            )}
            disabled={disabled}
            id={inputIdentifier}
            name={name}
            placeholder={placeholder}
            ref={reference}
            required={required}
            type={type}
            {...restProperties}
          />
          {trailingElement && (
            <div className="absolute inset-y-0 right-1 flex items-center">
              {trailingElement}
            </div>
          )}
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

InputField.displayName = "InputField";
