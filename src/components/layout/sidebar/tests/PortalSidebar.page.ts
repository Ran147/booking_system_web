import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Nullable } from "@/types";

export interface PortalSidebarPageObject {
  readonly clickNavItem: (label: string) => Promise<void>;
  readonly clickSignOut: () => Promise<void>;
  readonly findBrandInitials: (initials: string) => Promise<HTMLElement>;
  readonly findBrandName: (name: string) => Promise<HTMLElement>;
  readonly findNav: (ariaLabel: string) => Promise<HTMLElement>;
  readonly findNavItem: (label: string) => Promise<HTMLElement>;
  readonly querySignOut: () => Nullable<HTMLElement>;
}

export const createPortalSidebarPage = (): PortalSidebarPageObject => {
  const user = userEvent.setup();

  const findNav = (ariaLabel: string): Promise<HTMLElement> =>
    screen.findByRole("navigation", { name: ariaLabel });

  const findBrandName = (name: string): Promise<HTMLElement> =>
    screen.findByText(name);

  const findBrandInitials = (initials: string): Promise<HTMLElement> =>
    screen.findByText(initials);

  const findNavItem = (label: string): Promise<HTMLElement> =>
    screen.findByRole("button", { name: new RegExp(label, "i") });

  const clickNavItem = async (label: string): Promise<void> => {
    const item = await findNavItem(label);
    await user.click(item);
  };

  const clickSignOut = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: /cerrar sesión/i,
    });
    await user.click(button);
  };

  const querySignOut = (): Nullable<HTMLElement> =>
    screen.queryByRole("button", { name: /cerrar sesión/i });

  return {
    clickNavItem,
    clickSignOut,
    findBrandInitials,
    findBrandName,
    findNav,
    findNavItem,
    querySignOut,
  };
};
