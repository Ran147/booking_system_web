import { screen, waitFor } from "@testing-library/react";
import { LANGUAGE, STORAGE_KEY } from "@/constants";
import {
  COLLABORATOR_SESSION,
  renderWithProviders,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/test-utils";
import { SettingsPage } from "../SettingsPage";
import { createSettingsPage } from "./SettingsPage.page";
import { saveUserLanguage } from "../api/saveUserLanguage";

vi.mock("../api/saveUserLanguage");

describe("SettingsPage", () => {
  beforeEach(async () => {
    localStorage.clear();
    await testI18n.changeLanguage(LANGUAGE.ES);
    vi.mocked(saveUserLanguage).mockResolvedValue();
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
});
