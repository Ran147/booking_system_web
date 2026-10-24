import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LANGUAGE, STORAGE_KEY } from "@/constants";
import { testI18n } from "@/test-utils";
import { fetchUserLanguage } from "../api/fetchUserLanguage";
import { saveUserLanguage } from "../api/saveUserLanguage";
import { userLanguageQueryKeys } from "../api/userLanguageQueryKeys";
import { useUserLanguageSync } from "../hooks/useUserLanguageSync";
import { savePendingLanguageSync } from "../utils/languagePreferenceStorage";

vi.mock("../api/fetchUserLanguage");
vi.mock("../api/saveUserLanguage");

const CUSTOMER_USER_ID = "customer-1";

interface WrapperProps {
  readonly children: ReactNode;
}

describe("useUserLanguageSync", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: WrapperProps): ReactElement => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
    </QueryClientProvider>
  );

  beforeEach(async () => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    vi.mocked(fetchUserLanguage).mockResolvedValue({ language: LANGUAGE.ES });
    vi.mocked(saveUserLanguage).mockResolvedValue();
    await testI18n.changeLanguage(LANGUAGE.ES);
  });

  it("KAN-172: retries a pending customer language and clears it after success", async () => {
    savePendingLanguageSync({
      includeUpdatedAt: true,
      language: LANGUAGE.EN,
      userId: CUSTOMER_USER_ID,
    });

    renderHook(() => useUserLanguageSync(CUSTOMER_USER_ID), { wrapper });

    await waitFor(() =>
      expect(saveUserLanguage).toHaveBeenCalledWith({
        includeUpdatedAt: true,
        language: LANGUAGE.EN,
        userId: CUSTOMER_USER_ID,
      }),
    );
    await waitFor(() =>
      expect(
        localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC),
      ).toBeNull(),
    );
    expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN);
    expect(
      queryClient.getQueryData(userLanguageQueryKeys.detail(CUSTOMER_USER_ID)),
    ).toEqual({ language: LANGUAGE.EN });
  });

  it("KAN-172: keeps the local language and pending marker when retry fails", async () => {
    vi.mocked(saveUserLanguage).mockRejectedValue(new Error("offline"));
    savePendingLanguageSync({
      includeUpdatedAt: true,
      language: LANGUAGE.EN,
      userId: CUSTOMER_USER_ID,
    });

    renderHook(() => useUserLanguageSync(CUSTOMER_USER_ID), { wrapper });

    await waitFor(() => expect(saveUserLanguage).toHaveBeenCalledOnce());
    expect(testI18n.resolvedLanguage).toBe(LANGUAGE.EN);
    expect(
      localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC),
    ).not.toBeNull();
  });

  it("KAN-172: does not consume another user's pending preference", async () => {
    const otherPendingPreference = {
      includeUpdatedAt: true,
      language: LANGUAGE.EN,
      userId: "customer-2",
    } as const;
    savePendingLanguageSync(otherPendingPreference);

    renderHook(() => useUserLanguageSync(CUSTOMER_USER_ID), { wrapper });

    await waitFor(() => expect(fetchUserLanguage).toHaveBeenCalledOnce());
    expect(saveUserLanguage).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY.LANGUAGE_PENDING_SYNC)).toBe(
      JSON.stringify(otherPendingPreference),
    );
  });
});
