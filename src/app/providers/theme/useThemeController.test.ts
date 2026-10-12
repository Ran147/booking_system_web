import { act, renderHook, waitFor } from "@testing-library/react";
import {
  STORAGE_KEY,
  THEME_CLASS,
  THEME_MODE,
  THEME_MEDIA_QUERY,
} from "@/constants";
import { useThemeController } from "./useThemeController";

describe("useThemeController", () => {
  let handleSystemThemeChange: (event: MediaQueryListEvent) => void;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(THEME_CLASS.DARK);
    vi.stubGlobal(
      "matchMedia",
      vi.fn((mediaQuery: string) => ({
        addEventListener: (
          _eventName: string,
          eventListener: (event: MediaQueryListEvent) => void,
        ): void => {
          handleSystemThemeChange = eventListener;
        },
        matches: mediaQuery === THEME_MEDIA_QUERY.PREFERS_DARK ? false : false,
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.classList.remove(THEME_CLASS.DARK);
  });

  it("KAN-52: applies and stores the dark theme", async () => {
    const { result } = renderHook(() => useThemeController());

    act(() => result.current.setThemeMode(THEME_MODE.DARK));

    await waitFor(() =>
      expect(document.documentElement).toHaveClass(THEME_CLASS.DARK),
    );
    expect(localStorage.getItem(STORAGE_KEY.THEME)).toBe(THEME_MODE.DARK);
  });

  it("KAN-52: applies and stores the light theme", async () => {
    localStorage.setItem(STORAGE_KEY.THEME, THEME_MODE.DARK);
    const { result } = renderHook(() => useThemeController());

    act(() => result.current.setThemeMode(THEME_MODE.LIGHT));

    await waitFor(() =>
      expect(document.documentElement).not.toHaveClass(THEME_CLASS.DARK),
    );
    expect(localStorage.getItem(STORAGE_KEY.THEME)).toBe(THEME_MODE.LIGHT);
  });

  it("KAN-52: falls back to system for an invalid stored value", () => {
    localStorage.setItem(STORAGE_KEY.THEME, "sepia");

    const { result } = renderHook(() => useThemeController());

    expect(result.current.themeMode).toBe(THEME_MODE.SYSTEM);
  });

  it("KAN-52: follows operating system changes in system mode", async () => {
    const { result } = renderHook(() => useThemeController());

    act(() => {
      handleSystemThemeChange({ matches: true } as MediaQueryListEvent);
    });

    await waitFor(() => expect(result.current.isDarkApplied).toBe(true));
    expect(document.documentElement).toHaveClass(THEME_CLASS.DARK);
  });
});
