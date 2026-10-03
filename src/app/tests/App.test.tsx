import { render } from "@testing-library/react";
import { i18n } from "@/i18n/i18n";
import { SESSION_STATUS } from "@/modules/auth";
import { App } from "../App";
import { createAppPage } from "./App.page";

vi.mock("@/modules/auth/api/subscribeToSession", () => ({
  subscribeToSession: (
    onSessionChange: (session: { status: string }) => void,
  ): (() => void) => {
    onSessionChange({ status: SESSION_STATUS.SIGNED_OUT });
    return vi.fn();
  },
}));

describe("App", () => {
  beforeAll(() => {
    // jsdom has no matchMedia; the ThemeProvider reads the OS preference.
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("renders the landing portal with every app provider", async () => {
    render(<App />);
    const appPage = createAppPage();

    expect(
      await appPage.findPageHeading(i18n.t("landing:placeholder.title")),
    ).toBeInTheDocument();
  });
});
