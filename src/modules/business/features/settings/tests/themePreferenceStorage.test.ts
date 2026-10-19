import { THEME_MODE } from "@/constants";
import {
  clearPendingThemeSyncIfMatches,
  readPendingThemeSync,
  savePendingThemeSync,
} from "../utils/themePreferenceStorage";

describe("themePreferenceStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("KAN-52: preserves a newer pending choice when an older retry succeeds", () => {
    const olderPendingTheme = {
      theme: THEME_MODE.LIGHT,
      userId: "subscriber-test",
    } as const;
    const newerPendingTheme = {
      theme: THEME_MODE.DARK,
      userId: "subscriber-test",
    } as const;
    savePendingThemeSync(olderPendingTheme);
    savePendingThemeSync(newerPendingTheme);

    clearPendingThemeSyncIfMatches(olderPendingTheme);

    expect(readPendingThemeSync()).toEqual(newerPendingTheme);
  });
});
