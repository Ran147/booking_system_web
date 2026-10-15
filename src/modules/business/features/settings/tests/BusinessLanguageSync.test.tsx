import { waitFor } from "@testing-library/react";
import { LANGUAGE, STORAGE_KEY } from "@/constants";
import { BusinessLayout } from "@/modules/business/layout/BusinessLayout";
import {
  COLLABORATOR_SESSION,
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

    await waitFor(() =>
      expect(localStorage.getItem(STORAGE_KEY.LANGUAGE)).toBe(LANGUAGE.EN),
    );
    expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN);
  });

  it("KAN-51: preserves a local choice whose profile synchronization failed", async () => {
    localStorage.setItem(STORAGE_KEY.LANGUAGE, LANGUAGE.ES);
    localStorage.setItem(
      STORAGE_KEY.LANGUAGE_PENDING_SYNC,
      JSON.stringify({
        language: LANGUAGE.EN,
        userId: SUBSCRIBER_SESSION.userId,
      }),
    );
    await testI18n.changeLanguage(LANGUAGE.ES);
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.ES });

    renderWithProviders(<BusinessLayout />, {
      initialPath: "/business",
      session: SUBSCRIBER_SESSION,
    });

    await waitFor(() => expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN));
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE)).toBe(LANGUAGE.EN);
  });

  it("KAN-51: clears a pending sync when the remote profile already matches", async () => {
    localStorage.setItem(
      STORAGE_KEY.LANGUAGE_PENDING_SYNC,
      JSON.stringify({
        language: LANGUAGE.EN,
        userId: SUBSCRIBER_SESSION.userId,
      }),
    );
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.EN });

    renderWithProviders(<BusinessLayout />, {
      initialPath: "/business",
      session: SUBSCRIBER_SESSION,
    });

    await waitFor(() =>
      expect(
        localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC),
      ).toBeNull(),
    );
    expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN);
  });

  it("KAN-51: restores the current account without deleting another account pending sync", async () => {
    const pendingLanguageSync = JSON.stringify({
      language: LANGUAGE.EN,
      userId: SUBSCRIBER_SESSION.userId,
    });
    localStorage.setItem(
      STORAGE_KEY.LANGUAGE_PENDING_SYNC,
      pendingLanguageSync,
    );
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.EN });

    renderWithProviders(<BusinessLayout />, {
      initialPath: "/business",
      session: COLLABORATOR_SESSION,
    });

    await waitFor(() => expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN));
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC)).toBe(
      pendingLanguageSync,
    );
  });

  it("KAN-51: discards an invalid pending marker and restores the remote profile", async () => {
    localStorage.setItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC, "invalid-json");
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.EN });

    renderWithProviders(<BusinessLayout />, {
      initialPath: "/business",
      session: SUBSCRIBER_SESSION,
    });

    await waitFor(() => expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN));
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC)).toBeNull();
  });
});
