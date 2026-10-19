import { ChevronDown } from "lucide-react";
import type { ReactElement } from "react";
import { Button, BUTTON_VARIANT, Card, CardContent } from "@/components/common";
import { cn } from "@/shared/utils/cn";
import { useContactFaqViewModel } from "../hooks/useContactFaqViewModel";
import type { ContactFaqItem } from "../models/contact.model";

export interface ContactFaqSectionProps {
  readonly faqItems: readonly ContactFaqItem[];
  readonly subtitle: string;
  readonly title: string;
}

export const ContactFaqSection = ({
  faqItems,
  subtitle,
  title,
}: ContactFaqSectionProps): ReactElement => {
  const { openFaqId, toggleFaq } = useContactFaqViewModel(faqItems);

  return (
    <section aria-labelledby="faq-section-title" className="space-y-6">
      <div className="space-y-2">
        <h2
          id="faq-section-title"
          className="text-2xl font-bold tracking-tight text-foreground"
        >
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="space-y-3">
        {faqItems.map((item) => {
          const isOpen = openFaqId === item.id;
          return (
            <Card
              className="border-border/70 overflow-hidden transition-colors"
              key={item.id}
            >
              <Button
                aria-controls={`faq-answer-${item.id}`}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between p-5 text-left font-semibold text-foreground hover:bg-muted/40 transition-colors h-auto rounded-none"
                onClick={(): void => toggleFaq(item.id)}
                variant={BUTTON_VARIANT.GHOST}
              >
                <span>{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180 text-primary",
                  )}
                />
              </Button>

              {isOpen && (
                <CardContent
                  className="px-5 pb-5 pt-0"
                  id={`faq-answer-${item.id}`}
                >
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
};
