import { forwardRef, useId, type ForwardedRef, type ReactElement } from "react";
import { cn } from "@/utils/cn";
import { DEFAULT_TEXTAREA_ROWS } from "./constants/textareaField.constants";
import type { TextareaFieldProps } from "./models/textareaField.model";

export const TextareaField = forwardRef(
  (
    {
      className,
      disabled = false,
      error,
      helperText,
      id,
      label,
      maxLength,
      name,
      placeholder,
      required = false,
      rows = DEFAULT_TEXTAREA_ROWS,
      showCharacterCount = false,
      textareaClassName,
      value,
      ...restProperties
    }: TextareaFieldProps,
    reference: ForwardedRef<HTMLTextAreaElement>,
  ): ReactElement => {
    const generatedIdentifier = useId();
    const textareaIdentifier = id ?? name ?? generatedIdentifier;
    const errorIdentifier = `${textareaIdentifier}-error`;
    const helperIdentifier = `${textareaIdentifier}-helper`;

    const descriptionIdentifier = error
      ? errorIdentifier
      : helperText
        ? helperIdentifier
        : undefined;

    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", className)}>
        <div className="flex items-center justify-between">
          {label && (
            <label
              className="text-xs font-medium tracking-wide text-foreground flex items-center gap-1"
              htmlFor={textareaIdentifier}
            >
              {label}
              {required && (
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}

          {showCharacterCount && maxLength && (
            <span className="text-[11px] text-muted-foreground">
              {currentLength} / {maxLength}
            </span>
          )}
        </div>

        <div className="relative">
          <textarea
            aria-describedby={descriptionIdentifier}
            aria-invalid={Boolean(error)}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-lg bg-background text-foreground text-sm border resize-y transition-colors duration-200 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                : "border-border focus:border-primary focus:ring-primary/20",
              textareaClassName,
            )}
            disabled={disabled}
            id={textareaIdentifier}
            maxLength={maxLength}
            name={name}
            placeholder={placeholder}
            ref={reference}
            required={required}
            rows={rows}
            value={value}
            {...restProperties}
          />
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

TextareaField.displayName = "TextareaField";
