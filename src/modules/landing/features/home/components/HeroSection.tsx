import { ArrowRight, Sparkles } from "lucide-react";
import type { ReactElement } from "react";
import {
  Badge,
  BADGE_VARIANT,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from "@/components/common";
import { useHeroSectionViewModel } from "../hooks/useHeroSectionViewModel";

export const HeroSection = (): ReactElement => {
  const viewModel = useHeroSectionViewModel();

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden py-16 text-center sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="inline-flex items-center pb-6">
          <Badge leftIcon={Sparkles} variant={BADGE_VARIANT.LUXURY}>
            {viewModel.badgeLabel}
          </Badge>
        </div>

        <h1
          className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          id="hero-title"
        >
          {viewModel.title}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          {viewModel.tagline}
        </p>

        <div className="mt-10 flex justify-center">
          <Button
            ariaLabel={viewModel.ctaLabel}
            onClick={viewModel.handleCtaClick}
            rightIcon={ArrowRight}
            size={BUTTON_SIZE.LG}
            variant={BUTTON_VARIANT.DEFAULT}
          >
            {viewModel.ctaLabel}
          </Button>
        </div>
      </div>
    </section>
  );
};
