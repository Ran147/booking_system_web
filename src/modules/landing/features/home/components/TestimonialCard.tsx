import type { ReactElement } from "react";
import { Card, CardContent } from "@/components/common";
import { cn } from "@/shared/utils/cn";
import type { TestimonialCardProps } from "./TestimonialCard.types";
import { TESTIMONIALS_CONSTANTS } from "../constants/Testimonials.constants";

export type { TestimonialCardProps };

export const TestimonialCard = ({
  className,
  testimonial,
}: TestimonialCardProps): ReactElement => {
  return (
    <Card
      className={cn(
        "flex h-full flex-col justify-between border-border bg-card transition-shadow hover:shadow-xs",
        className,
      )}
    >
      <CardContent className="flex h-full flex-col justify-between p-6">
        <div>
          <div
            aria-label={`Calificación: ${testimonial.rating} de 5 estrellas`}
            className="mb-4 flex items-center space-x-1 text-primary"
            role="img"
          >
            {Array.from({ length: testimonial.rating }).map((_, index) => (
              <span
                aria-hidden="true"
                key={`star-${index}`}
                className="text-base"
              >
                {TESTIMONIALS_CONSTANTS.STAR_SYMBOL}
              </span>
            ))}
          </div>
          <p className="text-sm italic text-foreground sm:text-base">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <p className="font-semibold text-foreground">
            {testimonial.authorName}
          </p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {testimonial.businessName}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
