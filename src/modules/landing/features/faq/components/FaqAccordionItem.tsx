import { ChevronDown } from "lucide-react";
import type { ReactElement } from "react";
import { Button, BUTTON_VARIANT, Card, CardContent } from "@/components/common";
import { cn } from "@/utils/cn";
import type { FaqAccordionItemProps } from "../models/faq.model";

export const FaqAccordionItem = ({
  className,
  isExpanded,
  item,
  onToggle,
}: FaqAccordionItemProps): ReactElement => {
  const answerId = `faq-answer-${item.id}`;
  const questionId = `faq-question-${item.id}`;

  const handleToggle = (): void => {
    onToggle(item.id);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden border border-border bg-card transition-all duration-200",
        className,
      )}
    >
      <div className="p-0">
        <Button
          aria-controls={answerId}
          aria-expanded={isExpanded}
          className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold text-foreground hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary"
          id={questionId}
          onClick={handleToggle}
          type="button"
          variant={BUTTON_VARIANT.GHOST}
        >
          <span className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {item.question}
          </span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180 text-primary",
            )}
          />
        </Button>
      </div>

      {isExpanded && (
        <CardContent
          aria-labelledby={questionId}
          className="border-t border-border/40 px-5 pt-4 pb-5 text-sm leading-relaxed text-muted-foreground animate-in fade-in sm:text-base"
          id={answerId}
          role="region"
        >
          <p>{item.answer}</p>
        </CardContent>
      )}
    </Card>
  );
};
