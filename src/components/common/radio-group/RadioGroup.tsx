import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId, type ReactElement } from "react";
import { cn } from "@/utils/cn";
import type { RadioGroupProps } from "./models/radioGroup.model";

export const RadioGroup = ({
  disabled = false,
  label,
  onValueChange,
  options,
  value,
}: RadioGroupProps): ReactElement => {
  const groupIdentifier = useId();

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <RadioGroupPrimitive.Root
        className="grid gap-3 sm:grid-cols-3"
        disabled={disabled}
        onValueChange={onValueChange}
        value={value}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          const optionIdentifier = `${groupIdentifier}-${option.value}`;

          return (
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-card-foreground transition-colors",
                "hover:bg-muted focus-within:ring-2 focus-within:ring-ring",
                disabled && "cursor-not-allowed opacity-50",
                isSelected && "border-primary bg-muted",
              )}
              htmlFor={optionIdentifier}
              key={option.value}
            >
              <RadioGroupPrimitive.Item
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input text-primary outline-none"
                id={optionIdentifier}
                value={option.value}
              >
                <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-primary" />
              </RadioGroupPrimitive.Item>
              <span className="space-y-1">
                <span className="block text-sm font-medium">
                  {option.label}
                </span>
                {option.description ? (
                  <span className="block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </RadioGroupPrimitive.Root>
    </fieldset>
  );
};
