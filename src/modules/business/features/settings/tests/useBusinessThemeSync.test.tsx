import { renderHook, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { ThemeContext } from "@/app/providers/theme/ThemeContext";
import { THEME_MODE } from "@/constants";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { SUBSCRIBER_SESSION } from "@/test-utils";
import { useUserThemeQuery } from "../api/useUserThemeQuery";
import { useBusinessThemeSync } from "../hooks/useBusinessThemeSync";
import { savePendingThemeSync } from "../utils/themePreferenceStorage";

vi.mock("../api/useUserThemeQuery");

interface ThemeSyncWrapperProps {
  readonly children: ReactNode;
}

describe("useBusinessThemeSync", () => {
  const setThemeMode = vi.fn();

  const wrapper = ({ children }: ThemeSyncWrapperProps): ReactElement => (
    <AuthContext.Provider value={{ session: SUBSCRIBER_SESSION }}>
      <ThemeContext.Provider
        value={{
          isDarkApplied: false,
          setThemeMode,
          themeMode: THEME_MODE.SYSTEM,
        }}
      >
        {children}
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );

  beforeEach(() => {
    localStorage.clear();
    setThemeMode.mockClear();
    vi.mocked(useUserThemeQuery).mockReturnValue({
      ["data"]: { theme: THEME_MODE.DARK },
    } as ReturnType<typeof useUserThemeQuery>);
  });

  it("KAN-52: applies the account theme when the portal loads", async () => {
    renderHook(() => useBusinessThemeSync(), { wrapper });

    await waitFor(() =>
      expect(setThemeMode).toHaveBeenCalledWith(THEME_MODE.DARK),
    );
    expect(useUserThemeQuery).toHaveBeenCalledWith(SUBSCRIBER_SESSION.userId);
  });

  it("KAN-52: preserves a locally pending choice after a save failure", async () => {
    savePendingThemeSync({
      theme: THEME_MODE.LIGHT,
      userId: SUBSCRIBER_SESSION.userId,
    });

    renderHook(() => useBusinessThemeSync(), { wrapper });

    await waitFor(() =>
      expect(setThemeMode).toHaveBeenCalledWith(THEME_MODE.LIGHT),
    );
    expect(setThemeMode).not.toHaveBeenCalledWith(THEME_MODE.DARK);
  });
});
