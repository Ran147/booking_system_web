import { ROUTE_PATH } from "@/shared/constants";

export const FOOTER_SOCIAL_NETWORK = Object.freeze({
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  LINKEDIN: "linkedin",
  X: "x",
});

export const DEFAULT_LANDING_FOOTER_CONFIG = Object.freeze({
  EMAIL: "soporte@bookingsystem.com",
  PHONE: "+506 2222-0000",
  SOCIAL_URLS: Object.freeze({
    [FOOTER_SOCIAL_NETWORK.FACEBOOK]: "https://facebook.com/bookingsystem",
    [FOOTER_SOCIAL_NETWORK.INSTAGRAM]: "https://instagram.com/bookingsystem",
    [FOOTER_SOCIAL_NETWORK.LINKEDIN]:
      "https://linkedin.com/company/bookingsystem",
    [FOOTER_SOCIAL_NETWORK.X]: "https://x.com/bookingsystem",
  }),
});

export const FOOTER_NAVIGATION_ITEMS = Object.freeze([
  Object.freeze({
    HREF: ROUTE_PATH.LANDING.HOME,
    ID: "home",
    LABEL_KEY: "footer.links.home",
  }),
  Object.freeze({
    HREF: ROUTE_PATH.LANDING.PLANS,
    ID: "plans",
    LABEL_KEY: "footer.links.plans",
  }),
  Object.freeze({
    HREF: ROUTE_PATH.LANDING.CONTACT,
    ID: "contact",
    LABEL_KEY: "footer.links.contact",
  }),
  Object.freeze({
    HREF: ROUTE_PATH.LANDING.TERMS,
    ID: "terms",
    LABEL_KEY: "footer.links.terms",
  }),
]);

export const LINK_TARGET = Object.freeze({
  BLANK: "_blank",
});

export const URL_PROTOCOL = Object.freeze({
  HTTP: "http:",
  HTTPS: "https:",
});
