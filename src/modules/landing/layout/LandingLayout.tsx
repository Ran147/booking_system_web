import type { ReactElement } from "react";
import { Outlet } from "react-router";
import { LandingFooter } from "./components/LandingFooter";
import { LandingNavbar } from "./components/LandingNavbar";

export const LandingLayout = (): ReactElement => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNavbar />
      <main className="flex-1 px-6 py-8">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  );
};
