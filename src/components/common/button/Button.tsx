import { Slot } from "radix-ui";
import { forwardRef, type ForwardedRef, type ReactElement } from "react";
import { cn } from "@/utils/cn";
import { BUTTON_SIZE, BUTTON_VARIANT } from "./constants/button.constants";
import type { ButtonProps } from "./models/button.model";

const variantStyles: Record<string, string> = {
  [BUTTON_VARIANT.DANGER]:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs font-semibold",
  [BUTTON_VARIANT.DEFAULT]:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-semibold",
  [BUTTON_VARIANT.DESTRUCTIVE]:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs font-semibold",
  [BUTTON_VARIANT.GHOST]:
    "text-muted-foreground hover:text-foreground hover:bg-muted",
  [BUTTON_VARIANT.LINK]: "text-primary underline-offset-4 hover:underline",
  [BUTTON_VARIANT.LUXURY]:
    "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 shadow-xs font-semibold",
  [BUTTON_VARIANT.OUTLINE]:
    "border border-border bg-background text-foreground hover:bg-muted",
  [BUTTON_VARIANT.PRIMARY]:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-semibold",
  [BUTTON_VARIANT.SECONDARY]:
    "bg-muted text-foreground hover:bg-muted/80 border border-border",
};

const sizeStyles: Record<string, string> = {
  [BUTTON_SIZE.DEFAULT]: "h-9 px-4 py-2 text-sm gap-2",
  [BUTTON_SIZE.ICON]: "size-9 p-0 justify-center",
  [BUTTON_SIZE.LG]: "h-10 px-6 py-2.5 text-base gap-2.5",
  [BUTTON_SIZE.MD]: "h-9 px-4 py-2 text-sm gap-2",
  [BUTTON_SIZE.SM]: "h-8 px-3 py-1.5 text-xs gap-1.5",
};

export const Button = forwardRef(
  (
    {
      ariaLabel,
      asChild = false,
      children,
      className,
      disabled = false,
      fullWidth = false,
      isLoading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      size = BUTTON_SIZE.DEFAULT,
      type = "button",
      variant = BUTTON_VARIANT.DEFAULT,
      ...restProperties
    }: ButtonProps,
    reference: ForwardedRef<HTMLButtonElement>,
  ): ReactElement => {
    const Component = asChild ? Slot.Root : "button";
    const selectedVariant =
      variantStyles[variant] ?? variantStyles[BUTTON_VARIANT.DEFAULT];
    const selectedSize = sizeStyles[size] ?? sizeStyles[BUTTON_SIZE.DEFAULT];
    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <Component
        aria-busy={isLoading ? true : undefined}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 select-none shrink-0",
          selectedVariant,
          selectedSize,
          widthStyle,
          className,
        )}
        disabled={disabled || isLoading}
        ref={reference}
        type={asChild ? undefined : type}
        {...restProperties}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0"
          />
        ) : (
          LeftIcon && (
            <LeftIcon className="size-4 shrink-0 transition-transform duration-200" />
          )
        )}
        {children && <span>{children}</span>}
        {!isLoading && RightIcon && (
          <RightIcon className="size-4 shrink-0 transition-transform duration-200" />
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";
