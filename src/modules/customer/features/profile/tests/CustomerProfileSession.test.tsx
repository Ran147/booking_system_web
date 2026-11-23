import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";
import type { Session } from "@/modules/auth";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { CUSTOMER_SESSION, SIGNED_OUT_SESSION, testI18n } from "@/test-utils";
import type { NullableRef } from "@/types";
import { createCustomerProfilePage } from "./CustomerProfilePage.page";
import { fetchCustomerPersonalProfile } from "../api/fetchCustomerPersonalProfile";
import type { CustomerPersonalProfile } from "../models";
import { CustomerProfilePage } from "../pages/CustomerProfilePage";

vi.mock("../api/fetchCustomerPersonalProfile");

const firstProfile = {
  email: "first@demo.test",
  fullName: "First",
  phone: null,
};
const secondProfile = {
  email: "second@demo.test",
  fullName: "Second",
  phone: null,
};

describe("KAN-169 profile visibility during session transitions", () => {
  it("KAN-169 AC-10: a mounted page hides A on logout and while B loads, including late A completion", async () => {
    let resolveFirst!: (profile: NullableRef<CustomerPersonalProfile>) => void;
    let resolveSecond!: (profile: NullableRef<CustomerPersonalProfile>) => void;
    const firstRequest = new Promise<NullableRef<CustomerPersonalProfile>>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );
    const secondRequest = new Promise<NullableRef<CustomerPersonalProfile>>(
      (resolve) => {
        resolveSecond = resolve;
      },
    );
    vi.mocked(fetchCustomerPersonalProfile)
      .mockReset()
      .mockResolvedValueOnce(firstProfile)
      .mockReturnValueOnce(firstRequest)
      .mockReturnValueOnce(secondRequest);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    const renderSession = (session: Session): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={testI18n}>
          <AuthContext.Provider value={{ session }}>
            <MemoryRouter>
              <CustomerProfilePage />
            </MemoryRouter>
          </AuthContext.Provider>
        </I18nextProvider>
      </QueryClientProvider>
    );
    const view = render(renderSession(CUSTOMER_SESSION));
    const page = createCustomerProfilePage();
    await page.findValue(firstProfile.email);
    // Keep A's existing card visible during a same-account background refresh.
    await act(async () => {
      void queryClient.invalidateQueries();
    });
    view.rerender(renderSession(SIGNED_OUT_SESSION));
    expect(page.queryValue(firstProfile.email)).not.toBeInTheDocument();
    view.rerender(
      renderSession({ ...CUSTOMER_SESSION, userId: "second-user" }),
    );
    expect(page.queryValue(firstProfile.email)).not.toBeInTheDocument();
    expect(page.getLoading()).toBeInTheDocument();
    await act(async () => {
      resolveFirst(firstProfile);
      await firstRequest;
    });
    expect(page.queryValue(firstProfile.email)).not.toBeInTheDocument();
    await act(async () => {
      resolveSecond(secondProfile);
      await secondRequest;
    });
    expect(await page.findValue(secondProfile.email)).toBeInTheDocument();
    expect(page.queryValue(firstProfile.email)).not.toBeInTheDocument();
  });
});
