import { ROUTE_PATH } from "@/shared/constants";

export const DEFAULT_NAVBAR_LINKS = Object.freeze([
  Object.freeze({
    HREF: ROUTE_PATH.LANDING.HOME,
    ID: "home",
    LABEL_KEY: "home.navbar.links.home",
  }),
  Object.freeze({
    HREF: `${ROUTE_PATH.LANDING.HOME}#plans-section`,
    ID: "plans",
    LABEL_KEY: "home.navbar.links.plans",
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
  MOBILE_MENU_ID: "landing-navbar-mobile-menu",
  NAVBAR_LANDMARK_LABEL_KEY: "home.navbar.landmarkLabel",
});
