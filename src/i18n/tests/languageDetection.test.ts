import { afterEach, describe, expect, it, vi } from "vitest";
import { LANGUAGE, STORAGE_KEY } from "@/constants";

describe("i18n language detection (KAN-172)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.removeItem(STORAGE_KEY.LANGUAGE);
  });

  it.each([
    ["es-CR", LANGUAGE.ES],
    ["en-US", LANGUAGE.EN],
    ["fr-FR", LANGUAGE.ES],
  ])(
    "AC-KAN-172-05: resolves browser language %s to %s without a saved preference",
    async (browserLanguage, expectedLanguage) => {
      localStorage.removeItem(STORAGE_KEY.LANGUAGE);
      vi.spyOn(window.navigator, "languages", "get").mockReturnValue([
        browserLanguage,
      ]);
      vi.spyOn(window.navigator, "language", "get").mockReturnValue(
        browserLanguage,
      );
      vi.resetModules();

      const { i18n } = await import("../i18n");

      expect(i18n.resolvedLanguage).toBe(expectedLanguage);
    },
  );
});
