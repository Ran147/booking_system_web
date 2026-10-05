import { screen } from "@testing-library/react";
import { LANGUAGE, STORAGE_KEY } from "@/constants";
import { BusinessLayout } from "@/modules/business/layout/BusinessLayout";
import {
  renderWithProviders,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/test-utils";
import { fetchUserLanguage } from "../api/fetchUserLanguage";

vi.mock("../api/fetchUserLanguage");

describe("useBusinessLanguageSync", () => {
  beforeEach(async () => {
    localStorage.clear();
    await testI18n.changeLanguage(LANGUAGE.ES);
  });

  it("KAN-51: restores the language saved in the user profile", async () => {
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.EN });

    renderWithProviders(<BusinessLayout />, {
      initialPath: "/business",
      session: SUBSCRIBER_SESSION,
    });

    expect(await screen.findByText("Business portal")).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE)).toBe(LANGUAGE.EN);
  });

  it("KAN-51: preserves a local choice whose profile synchronization failed", async () => {
    localStorage.setItem(STORAGE_KEY.LANGUAGE, LANGUAGE.EN);
    localStorage.setItem(
      STORAGE_KEY.LANGUAGE_PENDING_SYNC,
      JSON.stringify({
        language: LANGUAGE.EN,
        userId: SUBSCRIBER_SESSION.userId,
      }),
    );
    await testI18n.changeLanguage(LANGUAGE.EN);
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.ES });

    renderWithProviders(<BusinessLayout />, {
      initialPath: "/business",
      session: SUBSCRIBER_SESSION,
    });

    expect(await screen.findByText("Business portal")).toBeInTheDocument();
    expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN);
  });
});
