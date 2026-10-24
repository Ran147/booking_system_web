import type { ReactElement } from "react";
import { cn } from "@/utils/cn";
import { FaqAccordionItem } from "./FaqAccordionItem";
import type { FaqGroupSectionProps } from "../models/faq.model";

export const FaqGroupSection = ({
  className,
  expandedItemIds,
  group,
  onToggleItem,
}: FaqGroupSectionProps): ReactElement => {
  const headingId = `faq-group-heading-${group.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-4", className)}
    >
      <h2
        className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
        id={headingId}
      >
        {group.title}
      </h2>

      <div className="flex flex-col gap-3">
        {group.items.map((item) => (
          <FaqAccordionItem
            isExpanded={expandedItemIds.has(item.id)}
            item={item}
            key={item.id}
            onToggle={onToggleItem}
          />
        ))}
      </div>
    </section>
  );
};
