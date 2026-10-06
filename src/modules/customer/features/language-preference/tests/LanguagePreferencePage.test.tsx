import { screen, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/common";
import { FIREBASE_ERROR_CODE, LANGUAGE, STORAGE_KEY } from "@/constants";
import {
  CUSTOMER_SESSION,
  renderWithProviders,
  testI18n,
} from "@/shared/test-utils";
import { createLanguagePreferencePage } from "./LanguagePreferencePage.page";
import { LanguagePreferencePage } from "../LanguagePreferencePage";
import * as fetchPreferenceModule from "../api/fetchLanguagePreference";
import * as updatePreferenceModule from "../api/updateLanguagePreference";

const renderPage = (): ReturnType<typeof createLanguagePreferencePage> => {
  renderWithProviders(<LanguagePreferencePage />, {
    initialPath: "/barberia/profile/language",
    session: CUSTOMER_SESSION,
  });
  return createLanguagePreferencePage();
};

describe("LanguagePreferencePage (KAN-172)", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    localStorage.clear();
    await testI18n.changeLanguage(LANGUAGE.ES);
    vi.spyOn(
      fetchPreferenceModule,
      "fetchLanguagePreference",
    ).mockResolvedValue(null);
  });

  it("AC-KAN-172-01: shows Spanish as the active language", async () => {
    const page = renderPage();

    await waitFor(() => expect(page.getSpanishOption()).toBeDisabled());
    expect(page.getSpanishOption()).toHaveAttribute("aria-pressed", "true");
    expect(page.getEnglishOption()).toHaveAttribute("aria-pressed", "false");
  });

  it("AC-KAN-172-01: switches ES to EN immediately and persists it", async () => {
    const updateSpy = vi
      .spyOn(updatePreferenceModule, "updateLanguagePreference")
      .mockResolvedValue();
    const page = renderPage();
    await waitFor(() => expect(page.getEnglishOption()).toBeEnabled());

    await page.clickEnglish();

    expect(
      await screen.findByRole("heading", { name: "Language" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE)).toBe(LANGUAGE.EN);
    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith({
        language: LANGUAGE.EN,
        userId: CUSTOMER_SESSION.userId,
      }),
    );
    expect(page.getEnglishOption()).toBeDisabled();
  });

  it("AC-KAN-172-01: switches EN to ES immediately", async () => {
    await testI18n.changeLanguage(LANGUAGE.EN);
    vi.spyOn(
      updatePreferenceModule,
      "updateLanguagePreference",
    ).mockResolvedValue();
    const page = renderPage();
    await waitFor(() => expect(page.getSpanishOption()).toBeEnabled());

    await page.clickSpanish();

    expect(
      await screen.findByRole("heading", { name: "Idioma" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE)).toBe(LANGUAGE.ES);
    expect(page.getSpanishOption()).toBeDisabled();
  });

  it("AC-KAN-172-02: applies the language loaded from the user account", async () => {
    vi.mocked(fetchPreferenceModule.fetchLanguagePreference).mockResolvedValue(
      LANGUAGE.EN,
    );
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Language" }),
    ).toBeInTheDocument();
  });

  it("AC-KAN-172-04: keeps the local language when account sync fails", async () => {
    vi.spyOn(
      updatePreferenceModule,
      "updateLanguagePreference",
    ).mockRejectedValue(
      new FirebaseError(
        FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
        FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
      ),
    );
    const errorSpy = vi.spyOn(toast, "error");
    const page = renderPage();
    await waitFor(() => expect(page.getEnglishOption()).toBeEnabled());

    await page.clickEnglish();

    expect(
      await screen.findByRole("heading", { name: "Language" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE)).toBe(LANGUAGE.EN);
    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
  });
});
