import { ArrowRight, Sparkles } from "lucide-react";
import type { ReactElement } from "react";
import {
  Badge,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CARD_VARIANT,
} from "@/components/common";
import { BADGE_VARIANT } from "@/components/common/badge/constants/badge.constants";
import type { QuickAccessCardProps } from "./QuickAccessCard.types";

export const QuickAccessCard = ({
  item,
  onActionClick,
}: QuickAccessCardProps): ReactElement => {
  const IconComponent = item.icon;
  const isAvailable = item.isAvailable;

  const handleCardClick = (): void => {
    onActionClick(item);
  };

  return (
    <Card
      className="flex flex-col justify-between border-border/80 bg-card/60 backdrop-blur-xs transition-all hover:border-primary/50 hover:shadow-md"
      hoverable
      onClick={handleCardClick}
      variant={CARD_VARIANT.DEFAULT}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors">
            <IconComponent className="size-6" />
          </div>
          {item.badgeLabel && (
            <Badge
              variant={
                item.badgeVariant ??
                (isAvailable ? BADGE_VARIANT.DEFAULT : BADGE_VARIANT.MUTED)
              }
            >
              {item.badgeLabel}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <CardTitle className="font-headline text-lg text-card-foreground">
            {item.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardFooter className="pt-0">
        <Button
          className="w-full justify-between"
          leftIcon={isAvailable ? undefined : Sparkles}
          onClick={handleCardClick}
          rightIcon={isAvailable ? ArrowRight : undefined}
          size={BUTTON_SIZE.SM}
          type="button"
          variant={
            isAvailable ? BUTTON_VARIANT.DEFAULT : BUTTON_VARIANT.OUTLINE
          }
        >
          <span>{item.actionLabel}</span>
        </Button>
      </CardFooter>
    </Card>
  );
};
