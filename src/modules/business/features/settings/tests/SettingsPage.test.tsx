import { screen, waitFor } from "@testing-library/react";
import { ThemeContext } from "@/app/providers/theme/ThemeContext";
import { LANGUAGE, ROUTE_PATH, STORAGE_KEY, THEME_MODE } from "@/constants";
import {
  BUSINESS_OWNER_SESSION,
  COLLABORATOR_SESSION,
  renderWithProviders,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/test-utils";
import { SettingsPage } from "../SettingsPage";
import { createSettingsPage } from "./SettingsPage.page";
import { saveUserLanguage } from "../api/saveUserLanguage";
import { saveUserTheme } from "../api/saveUserTheme";

vi.mock("../api/saveUserLanguage");
vi.mock("../api/saveUserTheme");

describe("SettingsPage", () => {
  beforeEach(async () => {
    localStorage.clear();
    await testI18n.changeLanguage(LANGUAGE.ES);
    vi.mocked(saveUserLanguage).mockResolvedValue();
    vi.mocked(saveUserTheme).mockResolvedValue();
  });

  it("renders language, appearance, and password navigation without the expanded form", () => {
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });

    expect(screen.getByRole("heading", { name: "Idioma" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Apariencia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Contraseña" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(
        testI18n.t("business:settings.password.currentPasswordLabel"),
      ),
    ).not.toBeInTheDocument();
    expect(createSettingsPage().getPasswordSettingsLink()).toHaveAttribute(
      "href",
      `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS_PASSWORD}`,
    );
  });

  it("KAN-199: shows the business-profile option to a subscriber", () => {
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });

    expect(createSettingsPage().getBusinessProfileLink()).toHaveAttribute(
      "href",
      `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.BUSINESS_PROFILE}`,
    );
  });

  it("KAN-199: shows the business-profile option to a business owner", () => {
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: BUSINESS_OWNER_SESSION,
    });

    expect(createSettingsPage().getBusinessProfileLink()).toHaveAttribute(
      "href",
      `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.BUSINESS_PROFILE}`,
    );
    expect(screen.getByRole("heading", { name: "Idioma" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Apariencia" }),
    ).toBeInTheDocument();
    expect(createSettingsPage().getPasswordSettingsLink()).toHaveAttribute(
      "href",
      `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS_PASSWORD}`,
    );
  });

  it("KAN-199: hides the business-profile option from a collaborator", () => {
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: COLLABORATOR_SESSION,
    });

    expect(
      createSettingsPage().queryBusinessProfileLink(),
    ).not.toBeInTheDocument();
    expect(createSettingsPage().getPasswordSettingsLink()).toHaveAttribute(
      "href",
      `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS_PASSWORD}`,
    );
  });

  it("KAN-51: changes Spanish to English immediately and persists it", async () => {
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });
    const page = createSettingsPage();

    await page.selectLanguage(LANGUAGE.EN);

    expect(
      await screen.findByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE)).toBe(LANGUAGE.EN);
    await waitFor(() =>
      expect(saveUserLanguage).toHaveBeenCalledWith({
        language: LANGUAGE.EN,
        userId: SUBSCRIBER_SESSION.userId,
      }),
    );
  });

  it("KAN-51: changes English to Spanish immediately", async () => {
    await testI18n.changeLanguage(LANGUAGE.EN);
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });
    const page = createSettingsPage();

    await page.selectLanguage(LANGUAGE.ES);

    expect(
      await screen.findByRole("heading", { name: "Configuración" }),
    ).toBeInTheDocument();
  });

  it("KAN-51: keeps the local language and reports a profile save failure", async () => {
    vi.mocked(saveUserLanguage).mockRejectedValue(new Error("offline"));
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });
    const page = createSettingsPage();

    await page.selectLanguage(LANGUAGE.EN);

    expect(
      await screen.findByText(
        "The language changed on this device, but it could not be saved to your account.",
      ),
    ).toHaveAttribute("role", "alert");
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE)).toBe(LANGUAGE.EN);
    expect(
      localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC),
    ).not.toBeNull();
  });

  it("KAN-51: exposes an accessible language selector", () => {
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: SUBSCRIBER_SESSION,
    });

    expect(createSettingsPage().getLanguageSelector()).toHaveValue(LANGUAGE.ES);
  });

  it("KAN-51: saves an active collaborator's own language", async () => {
    renderWithProviders(<SettingsPage />, {
      initialPath: "/business/settings",
      session: COLLABORATOR_SESSION,
    });

    await createSettingsPage().selectLanguage(LANGUAGE.EN);

    await waitFor(() =>
      expect(saveUserLanguage).toHaveBeenCalledWith(
        expect.objectContaining({ userId: COLLABORATOR_SESSION.userId }),
      ),
    );
  });

  it.each([
    ["light", THEME_MODE.LIGHT],
    ["dark", THEME_MODE.DARK],
    ["system", THEME_MODE.SYSTEM],
  ])("KAN-52: applies and persists the %s theme", async (_label, themeMode) => {
    const setThemeMode = vi.fn();
    const initialThemeMode =
      themeMode === THEME_MODE.SYSTEM ? THEME_MODE.DARK : THEME_MODE.SYSTEM;
    renderWithProviders(
      <ThemeContext.Provider
        value={{
          isDarkApplied: false,
          setThemeMode,
          themeMode: initialThemeMode,
        }}
      >
        <SettingsPage />
      </ThemeContext.Provider>,
      { initialPath: "/business/settings", session: SUBSCRIBER_SESSION },
    );
    const page = createSettingsPage();

    if (themeMode === THEME_MODE.LIGHT) await page.selectLightTheme();
    if (themeMode === THEME_MODE.DARK) await page.selectDarkTheme();
    if (themeMode === THEME_MODE.SYSTEM) await page.selectSystemTheme();

    expect(setThemeMode).toHaveBeenCalledWith(themeMode);
    await waitFor(() =>
      expect(saveUserTheme).toHaveBeenCalledWith({
        theme: themeMode,
        userId: SUBSCRIBER_SESSION.userId,
      }),
    );
  });

  it("KAN-52: keeps the local theme and reports a remote save failure", async () => {
    vi.mocked(saveUserTheme).mockRejectedValue(new Error("offline"));
    const setThemeMode = vi.fn();
    renderWithProviders(
      <ThemeContext.Provider
        value={{
          isDarkApplied: false,
          setThemeMode,
          themeMode: THEME_MODE.LIGHT,
        }}
      >
        <SettingsPage />
      </ThemeContext.Provider>,
      { initialPath: "/business/settings", session: SUBSCRIBER_SESSION },
    );

    await createSettingsPage().selectDarkTheme();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El tema cambió en este dispositivo",
    );
    expect(setThemeMode).toHaveBeenCalledWith(THEME_MODE.DARK);
    expect(localStorage.getItem(STORAGE_KEY.THEME_PENDING_SYNC)).not.toBeNull();
  });
});
