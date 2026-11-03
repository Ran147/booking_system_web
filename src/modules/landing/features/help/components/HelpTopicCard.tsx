import type { ReactElement } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common";
import { cn } from "@/utils/cn";
import type { HelpTopicCardProps } from "../models/help.model";

export const HelpTopicCard = ({
  className,
  topic,
}: HelpTopicCardProps): ReactElement => {
  const IconComponent = topic.icon;

  return (
    <Card
      aria-labelledby={`topic-title-${topic.id}`}
      className={cn(
        "flex flex-col border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <IconComponent className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle
            className="text-lg font-bold text-foreground"
            id={`topic-title-${topic.id}`}
          >
            {topic.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {topic.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="mt-auto pt-2">
        <ol className="flex flex-col gap-2 text-sm text-muted-foreground">
          {topic.steps.map((stepDescription, stepIndex) => (
            <li
              className="flex items-start gap-2.5"
              key={`step-${topic.id}-${stepIndex}`}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                {stepIndex + 1}
              </span>
              <span>{stepDescription}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};
