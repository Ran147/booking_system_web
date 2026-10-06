import { screen, waitFor } from "@testing-library/react";
import { ThemeContext } from "@/app/providers/theme/ThemeContext";
import { STORAGE_KEY, THEME_MODE, type ThemeMode } from "@/constants";
import { SUBSCRIBER_SESSION, renderWithProviders } from "@/test-utils";
import { SettingsPage } from "../SettingsPage";
import { createSettingsPage } from "./SettingsPage.page";
import { saveUserTheme } from "../api/saveUserTheme";

vi.mock("../api/saveUserTheme");

describe("SettingsPage", () => {
  const setThemeMode = vi.fn();

  const renderSettingsPage = (
    themeMode: ThemeMode = THEME_MODE.LIGHT,
  ): void => {
    renderWithProviders(
      <ThemeContext.Provider
        value={{
          isDarkApplied: false,
          setThemeMode,
          themeMode,
        }}
      >
        <SettingsPage />
      </ThemeContext.Provider>,
      { initialPath: "/business/settings", session: SUBSCRIBER_SESSION },
    );
  };

  beforeEach(() => {
    localStorage.clear();
    setThemeMode.mockClear();
    vi.mocked(saveUserTheme).mockResolvedValue();
  });

  it("KAN-52: changes to dark and persists the authenticated user's theme", async () => {
    renderSettingsPage();

    await createSettingsPage().selectDarkTheme();

    expect(setThemeMode).toHaveBeenCalledWith(THEME_MODE.DARK);
    await waitFor(() =>
      expect(saveUserTheme).toHaveBeenCalledWith({
        theme: THEME_MODE.DARK,
        userId: SUBSCRIBER_SESSION.userId,
      }),
    );
  });

  it("KAN-52: changes to light", async () => {
    renderSettingsPage(THEME_MODE.DARK);

    await createSettingsPage().selectLightTheme();

    expect(setThemeMode).toHaveBeenCalledWith(THEME_MODE.LIGHT);
  });

  it("KAN-52: keeps local behavior and reports a profile save failure", async () => {
    vi.mocked(saveUserTheme).mockRejectedValue(new Error("offline"));
    localStorage.setItem(STORAGE_KEY.LANGUAGE, "es");
    renderSettingsPage();

    await createSettingsPage().selectDarkTheme();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El tema cambió en este dispositivo",
    );
    expect(setThemeMode).toHaveBeenCalledWith(THEME_MODE.DARK);
    expect(localStorage.getItem(STORAGE_KEY.THEME_PENDING_SYNC)).not.toBeNull();
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE)).toBe("es");
  });
});
