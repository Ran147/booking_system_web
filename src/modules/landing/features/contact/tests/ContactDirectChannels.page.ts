import { screen } from "@testing-library/react";
import { FOOTER_SOCIAL_NETWORK } from "@/modules/landing/layout/constants";
import type { Nullable } from "@/shared/types";
import { testI18n } from "@/test-utils/testI18n";

const SOCIAL_ARIA_LABEL_KEY_MAP = {
  [FOOTER_SOCIAL_NETWORK.FACEBOOK]: "landing:contact.channels.social.facebook",
  [FOOTER_SOCIAL_NETWORK.INSTAGRAM]:
    "landing:contact.channels.social.instagram",
  [FOOTER_SOCIAL_NETWORK.LINKEDIN]: "landing:contact.channels.social.linkedin",
  [FOOTER_SOCIAL_NETWORK.X]: "landing:contact.channels.social.x",
} as const;

export interface ContactDirectChannelsPageObject {
  getEmailLink: (email?: string) => Nullable<HTMLAnchorElement>;
  getPhoneLink: (phone?: string) => Nullable<HTMLAnchorElement>;
  getSocialLink: (
    network: keyof typeof SOCIAL_ARIA_LABEL_KEY_MAP,
  ) => Nullable<HTMLAnchorElement>;
  getSocialLinks: () => HTMLAnchorElement[];
  queryCard: () => Nullable<HTMLElement>;
  queryEmailLink: () => Nullable<HTMLAnchorElement>;
  queryPhoneLink: () => Nullable<HTMLAnchorElement>;
}

export const createContactDirectChannelsPage =
  (): ContactDirectChannelsPageObject => {
    const queryCard = (): Nullable<HTMLElement> =>
      screen.queryByText(testI18n.t("landing:contact.channels.cardTitle"));

    const getEmailLink = (email?: string): Nullable<HTMLAnchorElement> => {
      if (email) {
        return screen.getByLabelText(
          testI18n.t("landing:contact.channels.emailAriaLabel", { email }),
        ) as HTMLAnchorElement;
      }
      return screen.getByLabelText(/correo/i) as HTMLAnchorElement;
    };

    const queryEmailLink = (): Nullable<HTMLAnchorElement> =>
      screen.queryByLabelText(/correo/i) as Nullable<HTMLAnchorElement>;

    const getPhoneLink = (phone?: string): Nullable<HTMLAnchorElement> => {
      if (phone) {
        return screen.getByLabelText(
          testI18n.t("landing:contact.channels.phoneAriaLabel", { phone }),
        ) as HTMLAnchorElement;
      }
      return screen.getByLabelText(/teléfono|llamar/i) as HTMLAnchorElement;
    };

    const queryPhoneLink = (): Nullable<HTMLAnchorElement> =>
      screen.queryByLabelText(
        /teléfono|llamar/i,
      ) as Nullable<HTMLAnchorElement>;

    const getSocialLink = (
      network: keyof typeof SOCIAL_ARIA_LABEL_KEY_MAP,
    ): Nullable<HTMLAnchorElement> =>
      screen.getByLabelText(
        testI18n.t(SOCIAL_ARIA_LABEL_KEY_MAP[network]),
      ) as HTMLAnchorElement;

    const getSocialLinks = (): HTMLAnchorElement[] =>
      screen.queryAllByRole("link", {
        name: /nueva pestaña/i,
      }) as HTMLAnchorElement[];

    return {
      getEmailLink,
      getPhoneLink,
      getSocialLink,
      getSocialLinks,
      queryCard,
      queryEmailLink,
      queryPhoneLink,
    };
  };
