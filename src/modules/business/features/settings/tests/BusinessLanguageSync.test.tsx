import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";
import { LANGUAGE, STORAGE_KEY } from "@/constants";
import type { Session } from "@/modules/auth";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import {
  COLLABORATOR_SESSION,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/test-utils";
import { fetchUserLanguage } from "../api/fetchUserLanguage";
import { saveUserLanguage } from "../api/saveUserLanguage";
import { useBusinessLanguageSync } from "../hooks/useBusinessLanguageSync";
import { savePendingLanguageSync } from "../utils/languagePreferenceStorage";

vi.mock("../api/fetchUserLanguage");
vi.mock("../api/saveUserLanguage");

interface LanguageSyncWrapperProps {
  readonly children: ReactNode;
}

describe("useBusinessLanguageSync", () => {
  let currentSession: Session;
  let testQueryClient: QueryClient;

  const wrapper = ({ children }: LanguageSyncWrapperProps): ReactElement => (
    <QueryClientProvider client={testQueryClient}>
      <I18nextProvider i18n={testI18n}>
        <AuthContext.Provider value={{ session: currentSession }}>
          <MemoryRouter>{children}</MemoryRouter>
        </AuthContext.Provider>
      </I18nextProvider>
    </QueryClientProvider>
  );

  beforeEach(async () => {
    localStorage.clear();
    currentSession = SUBSCRIBER_SESSION;
    testQueryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.EN });
    vi.mocked(saveUserLanguage).mockResolvedValue();
    await testI18n.changeLanguage(LANGUAGE.ES);
  });

  it("KAN-51: restores the language saved in the user profile", async () => {
    renderHook(() => useBusinessLanguageSync(), { wrapper });

    await waitFor(() =>
      expect(localStorage.getItem(STORAGE_KEY.LANGUAGE)).toBe(LANGUAGE.EN),
    );
    expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN);
  });

  it("KAN-51: immediately applies and retries a pending local choice after the remote read succeeds", async () => {
    let resolveRemoteLanguage: (value: {
      language: typeof LANGUAGE.ES;
    }) => void = () => undefined;
    vi.mocked(fetchUserLanguage).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRemoteLanguage = resolve;
        }),
    );
    savePendingLanguageSync({
      language: LANGUAGE.EN,
      userId: SUBSCRIBER_SESSION.userId,
    });

    renderHook(() => useBusinessLanguageSync(), { wrapper });

    await waitFor(() => expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN));
    expect(saveUserLanguage).not.toHaveBeenCalled();

    await act(async () => {
      resolveRemoteLanguage({ language: LANGUAGE.ES });
    });

    await waitFor(() =>
      expect(saveUserLanguage).toHaveBeenCalledWith({
        language: LANGUAGE.EN,
        userId: SUBSCRIBER_SESSION.userId,
      }),
    );
    await waitFor(() =>
      expect(
        localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC),
      ).toBeNull(),
    );
  });

  it("KAN-51: retries the same pending choice only once across rerenders", async () => {
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.ES });
    savePendingLanguageSync({
      language: LANGUAGE.EN,
      userId: SUBSCRIBER_SESSION.userId,
    });
    const { rerender } = renderHook(() => useBusinessLanguageSync(), {
      wrapper,
    });

    await waitFor(() => expect(saveUserLanguage).toHaveBeenCalledTimes(1));
    rerender();
    rerender();

    expect(saveUserLanguage).toHaveBeenCalledTimes(1);
  });

  it("KAN-51: preserves the local choice and marker when the retry fails", async () => {
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.ES });
    vi.mocked(saveUserLanguage).mockRejectedValue(new Error("offline"));
    savePendingLanguageSync({
      language: LANGUAGE.EN,
      userId: SUBSCRIBER_SESSION.userId,
    });

    renderHook(() => useBusinessLanguageSync(), { wrapper });

    await waitFor(() => expect(saveUserLanguage).toHaveBeenCalledTimes(1));
    expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN);
    expect(
      localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC),
    ).not.toBeNull();
  });

  it("KAN-51: keeps the pending choice without writing when the remote read fails", async () => {
    vi.mocked(fetchUserLanguage).mockRejectedValue(new Error("offline"));
    savePendingLanguageSync({
      language: LANGUAGE.EN,
      userId: SUBSCRIBER_SESSION.userId,
    });

    renderHook(() => useBusinessLanguageSync(), { wrapper });

    await waitFor(() => expect(fetchUserLanguage).toHaveBeenCalledOnce());
    expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN);
    expect(saveUserLanguage).not.toHaveBeenCalled();
    expect(
      localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC),
    ).not.toBeNull();
  });

  it("KAN-51: clears a pending sync when the remote profile already matches", async () => {
    savePendingLanguageSync({
      language: LANGUAGE.EN,
      userId: SUBSCRIBER_SESSION.userId,
    });

    renderHook(() => useBusinessLanguageSync(), { wrapper });

    await waitFor(() =>
      expect(
        localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC),
      ).toBeNull(),
    );
    expect(saveUserLanguage).not.toHaveBeenCalled();
    expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN);
  });

  it("KAN-51: restores the current account without deleting another account pending sync", async () => {
    const pendingLanguageSync = JSON.stringify({
      language: LANGUAGE.ES,
      userId: SUBSCRIBER_SESSION.userId,
    });
    localStorage.setItem(
      STORAGE_KEY.LANGUAGE_PENDING_SYNC,
      pendingLanguageSync,
    );
    currentSession = COLLABORATOR_SESSION;

    renderHook(() => useBusinessLanguageSync(), { wrapper });

    await waitFor(() => expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN));
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC)).toBe(
      pendingLanguageSync,
    );
    expect(saveUserLanguage).not.toHaveBeenCalled();
  });

  it("KAN-51: does not let an older response clear a newer local choice", async () => {
    let resolvePendingSave: () => void = () => undefined;
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.ES });
    vi.mocked(saveUserLanguage).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePendingSave = resolve;
        }),
    );
    savePendingLanguageSync({
      language: LANGUAGE.EN,
      userId: SUBSCRIBER_SESSION.userId,
    });

    renderHook(() => useBusinessLanguageSync(), { wrapper });
    await waitFor(() => expect(saveUserLanguage).toHaveBeenCalledTimes(1));

    savePendingLanguageSync({
      language: LANGUAGE.ES,
      userId: SUBSCRIBER_SESSION.userId,
    });
    await act(async () => {
      resolvePendingSave();
    });

    await waitFor(() =>
      expect(localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC)).toBe(
        JSON.stringify({
          language: LANGUAGE.ES,
          userId: SUBSCRIBER_SESSION.userId,
        }),
      ),
    );
  });

  it("KAN-51: does not apply an older account response after the session changes", async () => {
    let resolvePendingSave: () => void = () => undefined;
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.ES });
    vi.mocked(saveUserLanguage).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePendingSave = resolve;
        }),
    );
    savePendingLanguageSync({
      language: LANGUAGE.EN,
      userId: SUBSCRIBER_SESSION.userId,
    });
    const { rerender } = renderHook(() => useBusinessLanguageSync(), {
      wrapper,
    });
    await waitFor(() => expect(saveUserLanguage).toHaveBeenCalledTimes(1));

    currentSession = COLLABORATOR_SESSION;
    rerender();
    await waitFor(() => expect(testI18n.resolvedLanguage).toBe(LANGUAGE.ES));

    await act(async () => {
      resolvePendingSave();
    });

    expect(testI18n.resolvedLanguage).toBe(LANGUAGE.ES);
    expect(saveUserLanguage).toHaveBeenCalledTimes(1);
  });

  it.each(["invalid-json", JSON.stringify({ language: "fr" })])(
    "KAN-51: discards an invalid pending marker and restores the remote profile",
    async (invalidPendingLanguageSync) => {
      localStorage.setItem(
        STORAGE_KEY.LANGUAGE_PENDING_SYNC,
        invalidPendingLanguageSync,
      );

      renderHook(() => useBusinessLanguageSync(), { wrapper });

      await waitFor(() => expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN));
      expect(
        localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC),
      ).toBeNull();
    },
  );
});
