import { ROUTE_PATH } from "@/shared/constants";

export const DEFAULT_NAVBAR_LINKS = Object.freeze([
  Object.freeze({
    HREF: ROUTE_PATH.LANDING.HOME,
    ID: "home",
    LABEL_KEY: "home.navbar.links.home",
  }),
  Object.freeze({
    HREF: ROUTE_PATH.LANDING.ABOUT,
    ID: "about",
    LABEL_KEY: "home.navbar.links.about",
  }),
  Object.freeze({
    HREF: `${ROUTE_PATH.LANDING.HOME}#plans-section`,
    ID: "plans",
    LABEL_KEY: "home.navbar.links.plans",
  }),
  Object.freeze({
    HREF: ROUTE_PATH.LANDING.FAQ,
    ID: "faq",
    LABEL_KEY: "home.navbar.links.faq",
  }),
  Object.freeze({
    HREF: ROUTE_PATH.LANDING.HELP,
    ID: "help",
    LABEL_KEY: "home.navbar.links.help",
  }),
  Object.freeze({
    HREF: ROUTE_PATH.LANDING.CONTACT,
    ID: "contact",
    LABEL_KEY: "home.navbar.links.contact",
  }),
]);

export const LANDING_NAVBAR_CONSTANTS = Object.freeze({
  BRAND_NAME: "Booking System",
  ESCAPE_KEY: "Escape",
  LOGO_CONTAINER_ID: "landing-navbar-branding-logo",
  MOBILE_MENU_ID: "landing-navbar-mobile-menu",
  NAVBAR_LANDMARK_LABEL_KEY: "home.navbar.landmarkLabel",
});
