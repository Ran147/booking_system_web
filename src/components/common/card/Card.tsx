import type { KeyboardEvent, MouseEvent, ReactElement } from "react";
import { cn } from "@/utils/cn";
import { CARD_KEYBOARD_KEY, CARD_VARIANT } from "./constants/card.constants";
import type {
  CardActionProps,
  CardContentProps,
  CardDescriptionProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
  CardTitleProps,
} from "./models/card.model";

const cardVariantStyles: Record<string, string> = {
  [CARD_VARIANT.DEFAULT]:
    "bg-background text-foreground border-border shadow-xs",
  [CARD_VARIANT.ELEVATED]:
    "bg-background text-foreground border-border shadow-md",
  [CARD_VARIANT.INTERACTIVE]:
    "bg-background text-foreground border-border hover:border-primary/60 hover:shadow-lg transition-all duration-300",
  [CARD_VARIANT.LUXURY]:
    "bg-background text-foreground border-primary/30 shadow-lg",
};

export const Card = ({
  children,
  className,
  hoverable = false,
  isSelected = false,
  onClick,
  variant = CARD_VARIANT.DEFAULT,
  ...restProperties
}: CardProps): ReactElement => {
  const selectedStyle =
    cardVariantStyles[variant] ?? cardVariantStyles[CARD_VARIANT.DEFAULT];
  const interactiveStyle = onClick || hoverable ? "cursor-pointer" : "";
  const selectedBorder = isSelected
    ? "border-primary ring-2 ring-primary/40 shadow-lg"
    : "";

  const handleKeyDown = onClick
    ? (keyboardEvent: KeyboardEvent<HTMLDivElement>): void => {
        if (
          keyboardEvent.key === CARD_KEYBOARD_KEY.ENTER ||
          keyboardEvent.key === CARD_KEYBOARD_KEY.SPACE
        ) {
          onClick(keyboardEvent as unknown as MouseEvent<HTMLDivElement>);
        }
      }
    : undefined;

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300",
        selectedStyle,
        interactiveStyle,
        selectedBorder,
        className,
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...restProperties}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className,
  ...restProperties
}: CardHeaderProps): ReactElement => {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...restProperties}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({
  children,
  className,
  ...restProperties
}: CardTitleProps): ReactElement => {
  return (
    <h3
      className={cn(
        "font-semibold text-foreground leading-none tracking-tight",
        className,
      )}
      {...restProperties}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({
  children,
  className,
  ...restProperties
}: CardDescriptionProps): ReactElement => {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...restProperties}
    >
      {children}
    </p>
  );
};

export const CardAction = ({
  children,
  className,
  ...restProperties
}: CardActionProps): ReactElement => {
  return (
    <div
      className={cn("self-start justify-self-end", className)}
      {...restProperties}
    >
      {children}
    </div>
  );
};

export const CardContent = ({
  children,
  className,
  ...restProperties
}: CardContentProps): ReactElement => {
  return (
    <div className={cn("p-6 pt-0", className)} {...restProperties}>
      {children}
    </div>
  );
};

export const CardFooter = ({
  children,
  className,
  ...restProperties
}: CardFooterProps): ReactElement => {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...restProperties}
    >
      {children}
    </div>
  );
};
