import { render, screen } from "@testing-library/react";
import { LayoutDashboard, Users } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Badge, BADGE_VARIANT } from "@/components/common";
import { PortalSidebar } from "../PortalSidebar";
import type { PortalSidebarItem } from "../models";
import { createPortalSidebarPage } from "./PortalSidebar.page";

const mockNavItems: PortalSidebarItem[] = [
  {
    description: "Vista general del portal",
    href: "/portal/dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
    isAvailable: true,
    label: "Dashboard",
  },
  {
    badgeLabel: "Próximamente",
    badgeVariant: BADGE_VARIANT.MUTED,
    description: "Gestión de usuarios",
    icon: Users,
    id: "users",
    isAvailable: false,
    label: "Usuarios",
  },
];

describe("PortalSidebar (Reusable Layout Component)", () => {
  it("renders brand name, initials, badge, and navigation items", async () => {
    const handleItemClick = vi.fn();

    render(
      <PortalSidebar
        ariaLabel="Navegación principal"
        badge={<Badge variant={BADGE_VARIANT.OUTLINE}>Administrador</Badge>}
        brandName="Sistema Central"
        navItems={mockNavItems}
        onItemClick={handleItemClick}
      />,
    );
    const page = createPortalSidebarPage();

    expect(await page.findNav("Navegación principal")).toBeInTheDocument();
    expect(await page.findBrandName("Sistema Central")).toBeInTheDocument();
    expect(await page.findBrandInitials("SC")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(await page.findNavItem("Dashboard")).toBeInTheDocument();
    expect(await page.findNavItem("Usuarios")).toBeInTheDocument();
  });

  it("calls onItemClick when a navigation item is clicked", async () => {
    const handleItemClick = vi.fn();

    render(
      <PortalSidebar
        ariaLabel="Navegación principal"
        brandName="Mi Portal"
        navItems={mockNavItems}
        onItemClick={handleItemClick}
      />,
    );
    const page = createPortalSidebarPage();

    await page.clickNavItem("Dashboard");

    expect(handleItemClick).toHaveBeenCalledWith(mockNavItems[0]);
  });

  it("renders sign-out button and calls onSignOut callback when provided", async () => {
    const handleSignOut = vi.fn();

    render(
      <PortalSidebar
        ariaLabel="Navegación principal"
        brandName="Mi Portal"
        navItems={mockNavItems}
        onItemClick={vi.fn()}
        onSignOut={handleSignOut}
        signOutLabel="Cerrar sesión"
      />,
    );
    const page = createPortalSidebarPage();

    await page.clickSignOut();

    expect(handleSignOut).toHaveBeenCalledTimes(1);
  });

  it("omits sign-out action when onSignOut is undefined", () => {
    render(
      <PortalSidebar
        ariaLabel="Navegación principal"
        brandName="Mi Portal"
        navItems={mockNavItems}
        onItemClick={vi.fn()}
      />,
    );
    const page = createPortalSidebarPage();

    expect(page.querySignOut()).not.toBeInTheDocument();
  });
});
