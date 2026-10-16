export const TESTIMONIALS_CONSTANTS = Object.freeze({
  BADGE_KEY: "home.testimonials.badge",
  CONTAINER_SECTION_ID: "testimonials-section",
  DEFAULT_MAX_RATING: 5,
  HEADING_ID: "testimonials-heading",
  ITEMS: Object.freeze([
    Object.freeze({
      AUTHOR_NAME_KEY: "home.testimonials.items.item1.authorName",
      BUSINESS_NAME_KEY: "home.testimonials.items.item1.businessName",
      ID: "testimonial-1",
      QUOTE_KEY: "home.testimonials.items.item1.quote",
      RATING: 5,
    }),
    Object.freeze({
      AUTHOR_NAME_KEY: "home.testimonials.items.item2.authorName",
      BUSINESS_NAME_KEY: "home.testimonials.items.item2.businessName",
      ID: "testimonial-2",
      QUOTE_KEY: "home.testimonials.items.item2.quote",
      RATING: 5,
    }),
    Object.freeze({
      AUTHOR_NAME_KEY: "home.testimonials.items.item3.authorName",
      BUSINESS_NAME_KEY: "home.testimonials.items.item3.businessName",
      ID: "testimonial-3",
      QUOTE_KEY: "home.testimonials.items.item3.quote",
      RATING: 5,
    }),
  ]),
  STAR_SYMBOL: "★",
  SUBTITLE_KEY: "home.testimonials.subtitle",
  TITLE_KEY: "home.testimonials.title",
} as const);
