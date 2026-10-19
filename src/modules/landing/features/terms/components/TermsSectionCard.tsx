import type { ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { cn } from "@/shared/utils/cn";
import type { TermsSectionCardProps } from "./TermsSectionCard.types";

export type { TermsSectionCardProps };

export const TermsSectionCard = ({
  className,
  clause,
}: TermsSectionCardProps): ReactElement => {
  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground sm:text-xl">
          {clause.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {clause.body}
        </p>
      </CardContent>
    </Card>
  );
};
