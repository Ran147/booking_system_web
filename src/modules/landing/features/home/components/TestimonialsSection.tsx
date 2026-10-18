import type { ReactElement } from "react";
import { Badge, BADGE_VARIANT } from "@/components/common";
import type { Nullable } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { TestimonialCard } from "./TestimonialCard";
import type { TestimonialsSectionProps } from "./TestimonialsSection.types";
import { TESTIMONIALS_CONSTANTS } from "../constants/Testimonials.constants";
import { useTestimonialsViewModel } from "../hooks/useTestimonialsViewModel";

export type { TestimonialsSectionProps };

export const TestimonialsSection = ({
  className,
}: TestimonialsSectionProps): Nullable<ReactElement> => {
  const viewModel = useTestimonialsViewModel();

  if (!viewModel.hasTestimonials) {
    return null;
  }

  return (
    <section
      aria-labelledby={TESTIMONIALS_CONSTANTS.HEADING_ID}
      className={cn("mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8", className)}
      id={TESTIMONIALS_CONSTANTS.CONTAINER_SECTION_ID}
    >
      <div className="flex flex-col items-center text-center">
        <Badge className="mb-4" variant={BADGE_VARIANT.SECONDARY}>
          {viewModel.badge}
        </Badge>
        <h2
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl"
          id={TESTIMONIALS_CONSTANTS.HEADING_ID}
        >
          {viewModel.title}
        </h2>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {viewModel.subtitle}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {viewModel.testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </div>
    </section>
  );
};
