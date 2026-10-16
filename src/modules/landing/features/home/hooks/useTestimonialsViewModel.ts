import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import { TESTIMONIALS_CONSTANTS } from "../constants/Testimonials.constants";
import type {
  TestimonialItem,
  TestimonialsViewModel,
} from "../models/TestimonialsViewModel.interface";

export const useTestimonialsViewModel = (): TestimonialsViewModel => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  const badge = t(TESTIMONIALS_CONSTANTS.BADGE_KEY);
  const title = t(TESTIMONIALS_CONSTANTS.TITLE_KEY);
  const subtitle = t(TESTIMONIALS_CONSTANTS.SUBTITLE_KEY);

  const testimonials = useMemo((): readonly TestimonialItem[] => {
    return TESTIMONIALS_CONSTANTS.ITEMS.map((item): TestimonialItem => ({
      authorName: t(item.AUTHOR_NAME_KEY),
      businessName: t(item.BUSINESS_NAME_KEY),
      id: item.ID,
      quote: t(item.QUOTE_KEY),
      rating: item.RATING,
    })).filter((item) => Boolean(item.quote) && item.quote !== item.id);
  }, [t]);

  const hasTestimonials = testimonials.length > 0;

  return {
    badge,
    hasTestimonials,
    subtitle,
    testimonials,
    title,
  };
};
