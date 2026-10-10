import type { ReactElement } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CARD_VARIANT,
} from "@/components/common";
import type { MetricCardProps } from "./MetricCard.types";

export const MetricCard = ({ metric }: MetricCardProps): ReactElement => {
  const IconComponent = metric.icon;

  return (
    <Card
      className="border-border/60 bg-card/40"
      variant={CARD_VARIANT.DEFAULT}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.label}
        </CardTitle>
        {IconComponent && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <IconComponent className="size-4" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="font-headline text-2xl font-bold tracking-tight text-foreground">
          {metric.value}
        </p>
        {metric.helperText && (
          <p className="text-xs text-muted-foreground">{metric.helperText}</p>
        )}
      </CardContent>
    </Card>
  );
};
