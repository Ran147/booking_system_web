import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "@/app/providers/theme/ThemeProvider";
import { STORAGE_KEY, THEME_MODE } from "@/constants";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { CUSTOMER_SESSION } from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import { ThemePreferencePage } from "../ThemePreferencePage";
import { createThemePreferencePage } from "./ThemePreferencePage.page";
import { fetchThemePreference } from "../api/fetchThemePreference";
import { updateThemePreference } from "../api/updateThemePreference";

vi.mock("../api/fetchThemePreference");
vi.mock("../api/updateThemePreference");

const renderPage = (): void => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={testI18n}>
        <ThemeProvider>
          <AuthContext.Provider value={{ session: CUSTOMER_SESSION }}>
            <ThemePreferencePage />
          </AuthContext.Provider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
};

describe("KAN-173 theme preference", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    vi.mocked(fetchThemePreference).mockResolvedValue(THEME_MODE.LIGHT);
    vi.mocked(updateThemePreference).mockResolvedValue(undefined);
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("AC-KAN-173-02: shows and applies the theme stored in the customer account", async () => {
    renderPage();
    const page = createThemePreferencePage();

    expect(await page.findActiveTheme("Claro")).toBeInTheDocument();
    expect(page.getLightThemeButton()).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem(STORAGE_KEY.THEME)).toBe(THEME_MODE.LIGHT);
  });

  it("AC-KAN-173-04: restores a locally stored theme without changing it", async () => {
    localStorage.setItem(STORAGE_KEY.THEME, THEME_MODE.DARK);
    vi.mocked(fetchThemePreference).mockResolvedValue(null);

    renderPage();
    const page = createThemePreferencePage();

    expect(await page.findActiveTheme("Oscuro")).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(STORAGE_KEY.THEME)).toBe(THEME_MODE.DARK);
  });

  it("AC-KAN-173-01: changes light to dark immediately and persists it", async () => {
    renderPage();
    const page = createThemePreferencePage();
    await page.findActiveTheme("Claro");

    await page.clickDarkTheme();

    expect(await page.findActiveTheme("Oscuro")).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(STORAGE_KEY.THEME)).toBe(THEME_MODE.DARK);
    expect(updateThemePreference).toHaveBeenCalledWith({
      themeMode: THEME_MODE.DARK,
      userId: CUSTOMER_SESSION.userId,
    });
  });

  it("AC-KAN-173-01: changes dark to light and marks the active option", async () => {
    vi.mocked(fetchThemePreference).mockResolvedValue(THEME_MODE.DARK);
    renderPage();
    const page = createThemePreferencePage();
    await page.findActiveTheme("Oscuro");

    await page.clickLightTheme();

    expect(await page.findActiveTheme("Claro")).toBeInTheDocument();
    expect(page.getLightThemeButton()).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("AC-KAN-173-03: follows the system preference when system is selected", async () => {
    vi.mocked(fetchThemePreference).mockResolvedValue(THEME_MODE.SYSTEM);
    vi.mocked(window.matchMedia).mockReturnValue({
      addEventListener: vi.fn(),
      matches: true,
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);

    renderPage();

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
  });

  it("AC-KAN-173-05: keeps the local theme and reports a sync failure", async () => {
    vi.mocked(updateThemePreference).mockRejectedValue(new Error("network"));
    renderPage();
    const page = createThemePreferencePage();
    await page.findActiveTheme("Claro");

    await page.clickDarkTheme();

    expect(await page.findActiveTheme("Oscuro")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      testI18n.t("customer:profile.preferences.syncError"),
    );
    expect(localStorage.getItem(STORAGE_KEY.THEME)).toBe(THEME_MODE.DARK);
  });
});
