import type { ReactElement } from "react";
import {
  Badge,
  BADGE_VARIANT,
  Button,
  BUTTON_VARIANT,
} from "@/components/common";
import { cn } from "@/shared/utils/cn";
import type { PlatformIntroSectionProps } from "./PlatformIntroSection.types";
import { PLATFORM_INTRO_CONSTANTS } from "../constants/PlatformIntro.constants";
import { usePlatformIntroViewModel } from "../hooks/usePlatformIntroViewModel";

export type { PlatformIntroSectionProps };

export const PlatformIntroSection = ({
  className,
}: PlatformIntroSectionProps): ReactElement => {
  const viewModel = usePlatformIntroViewModel();

  return (
    <section
      aria-labelledby="platform-intro-heading"
      className={cn("mx-auto max-w-5xl px-4 py-12 md:py-16", className)}
      id={PLATFORM_INTRO_CONSTANTS.CONTAINER_SECTION_ID}
    >
      <div className="flex flex-col items-center text-center">
        <Badge className="mb-4" variant={BADGE_VARIANT.SECONDARY}>
          {viewModel.badge}
        </Badge>
        <h2
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl"
          id="platform-intro-heading"
        >
          {viewModel.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
          {viewModel.summary}
        </p>

        {viewModel.isExpanded && (
          <div
            aria-live="polite"
            className="mt-4 max-w-3xl animate-in fade-in duration-300"
            id={PLATFORM_INTRO_CONSTANTS.FULL_TEXT_CONTAINER_ID}
          >
            <p className="rounded-xl border border-border bg-card p-6 text-left text-sm text-card-foreground shadow-xs sm:text-base">
              {viewModel.fullText}
            </p>
          </div>
        )}

        {viewModel.hasFullText && (
          <div className="mt-6">
            <Button
              aria-controls={PLATFORM_INTRO_CONSTANTS.FULL_TEXT_CONTAINER_ID}
              aria-expanded={viewModel.isExpanded}
              onClick={viewModel.handleToggle}
              variant={BUTTON_VARIANT.OUTLINE}
            >
              {viewModel.toggleButtonLabel}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {viewModel.features.map((feature) => (
          <div
            key={feature.key}
            className="rounded-lg border border-border bg-card p-5 text-left text-card-foreground transition-shadow hover:shadow-xs"
          >
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
