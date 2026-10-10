import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import { BROWSER_EVENT, I18N_NAMESPACE, ROUTE_PATH } from "@/shared/constants";
import { USER_ROLE, type UserRole } from "@/shared/domain";
import {
  DEFAULT_NAVBAR_LINKS,
  LANDING_NAVBAR_CONSTANTS,
} from "../constants/landingNavbar.constants";
import type {
  LandingNavbarViewModel,
  NavbarNavLink,
} from "../models/landingNavbar.model";

const resolvePortalPath = (role: UserRole): string => {
  if (role === USER_ROLE.SUPER_ADMIN) {
    return ROUTE_PATH.ADMIN.ROOT;
  }
  if (role === USER_ROLE.SUBSCRIBER || role === USER_ROLE.COLLABORATOR) {
    return ROUTE_PATH.BUSINESS.ROOT;
  }
  return ROUTE_PATH.LANDING.HOME;
};

export const useLandingNavbarViewModel = (): LandingNavbarViewModel => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const navigate = useNavigate();
  const session = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isSignedIn = session.status === SESSION_STATUS.SIGNED_IN;

  const portalActionLabel = isSignedIn
    ? t("home.navbar.goToPortal")
    : t("home.navbar.signIn");

  const portalActionPath =
    session.status === SESSION_STATUS.SIGNED_IN
      ? resolvePortalPath(session.role)
      : ROUTE_PATH.AUTH.SIGN_IN;

  const navLinks: readonly NavbarNavLink[] = DEFAULT_NAVBAR_LINKS.map(
    (item) => ({
      href: item.HREF,
      id: item.ID,
      label: t(item.LABEL_KEY),
    }),
  );

  const closeMobileMenu = (): void => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen((previousState) => !previousState);
  };

  const handleNavigate = (targetPath: string): void => {
    closeMobileMenu();

    if (targetPath.includes("#")) {
      const hashSegment = targetPath.split("#")[1];

      if (hashSegment) {
        const targetElement = document.getElementById(hashSegment);

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }
    }

    void navigate(targetPath);
  };

  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent): void => {
      if (
        keyboardEvent.key === LANDING_NAVBAR_CONSTANTS.ESCAPE_KEY &&
        isMobileMenuOpen
      ) {
        closeMobileMenu();
      }
    };

    window.addEventListener(BROWSER_EVENT.KEY_DOWN, handleKeyDown);
    return (): void => {
      window.removeEventListener(BROWSER_EVENT.KEY_DOWN, handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return {
    brandName: LANDING_NAVBAR_CONSTANTS.BRAND_NAME,
    closeMobileMenu,
    handleNavigate,
    isMobileMenuOpen,
    isSignedIn,
    logoAlt: t("home.navbar.logoAlt"),
    navLinks,
    portalActionLabel,
    portalActionPath,
    toggleMobileMenu,
  };
};
