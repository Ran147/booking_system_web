import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { ThemeContext } from "@/app/providers/theme/ThemeContext";
import { STORAGE_KEY, THEME_MODE } from "@/constants";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { SUBSCRIBER_SESSION } from "@/test-utils";
import { saveUserTheme } from "../api/saveUserTheme";
import { useSettingsPageViewModel } from "../hooks/useSettingsPageViewModel";

vi.mock("../api/saveUserTheme");

interface SettingsViewModelWrapperProps {
  readonly children: ReactNode;
}

describe("useSettingsPageViewModel", () => {
  const setThemeMode = vi.fn();
  let testQueryClient: QueryClient;

  const wrapper = ({
    children,
  }: SettingsViewModelWrapperProps): ReactElement => (
    <QueryClientProvider client={testQueryClient}>
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
    </QueryClientProvider>
  );

  beforeEach(() => {
    localStorage.clear();
    setThemeMode.mockClear();
    testQueryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    vi.mocked(saveUserTheme).mockResolvedValue();
  });

  it("KAN-52: ignores a theme value outside the canonical modes", () => {
    const { result } = renderHook(() => useSettingsPageViewModel(), {
      wrapper,
    });

    act(() => result.current.handleThemeChange("sepia"));

    expect(setThemeMode).not.toHaveBeenCalled();
    expect(saveUserTheme).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY.THEME_PENDING_SYNC)).toBeNull();
  });
});
