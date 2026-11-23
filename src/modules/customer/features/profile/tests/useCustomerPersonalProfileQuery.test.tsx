import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  renderHook,
  waitFor,
  type RenderHookResult,
} from "@testing-library/react";
import type { PropsWithChildren, ReactElement } from "react";
import { USER_ROLE } from "@/domain";
import { SESSION_STATUS, type Session } from "@/modules/auth";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import {
  CUSTOMER_SESSION,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
} from "@/test-utils";
import type { NullableRef } from "@/types";
import { customerPersonalProfileQueryKeys } from "../api/customerPersonalProfileQueryKeys";
import { fetchCustomerPersonalProfile } from "../api/fetchCustomerPersonalProfile";
import { useCustomerPersonalProfileQuery } from "../api/useCustomerPersonalProfileQuery";
import type { CustomerPersonalProfile } from "../models";

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

interface QueryHarness extends RenderHookResult<
  ReturnType<typeof useCustomerPersonalProfileQuery>,
  void
> {
  queryClient: QueryClient;
  changeSession: (session: Session) => void;
}

const createQueryHarness = (initialSession: Session): QueryHarness => {
  let currentSession = initialSession;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ session: currentSession }}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
  const hook = renderHook(useCustomerPersonalProfileQuery, {
    wrapper: Wrapper,
  });
  return {
    ...hook,
    queryClient,
    changeSession: (session: Session): void => {
      currentSession = session;
      hook.rerender();
    },
  };
};

beforeEach(() => vi.mocked(fetchCustomerPersonalProfile).mockReset());

describe("KAN-169 session-bound query", () => {
  it.each([
    SIGNED_OUT_SESSION,
    SUBSCRIBER_SESSION,
    { status: SESSION_STATUS.LOADING },
    { ...CUSTOMER_SESSION, userId: "" },
  ] satisfies Session[])(
    "KAN-169 AC-06: never reads for an unauthorized or unresolved session (%j)",
    (session) => {
      const harness = createQueryHarness(session);
      expect(harness.result.current.fetchStatus).toBe("idle");
      expect(fetchCustomerPersonalProfile).not.toHaveBeenCalled();
    },
  );

  it.each([USER_ROLE.CUSTOMER, USER_ROLE.CLIENT])(
    "KAN-169 AC-06: inherits the current guard compatibility (%s)",
    async (role) => {
      vi.mocked(fetchCustomerPersonalProfile).mockResolvedValue(firstProfile);
      const harness = createQueryHarness({ ...CUSTOMER_SESSION, role });
      await waitFor(() =>
        expect(harness.result.current.data).toEqual(firstProfile),
      );
      expect(fetchCustomerPersonalProfile).toHaveBeenCalledWith(
        CUSTOMER_SESSION.userId,
      );
    },
  );

  it("KAN-169 AC-10: removes A immediately on logout and never uses A's retained cache for B", async () => {
    vi.mocked(fetchCustomerPersonalProfile)
      .mockResolvedValueOnce(firstProfile)
      .mockReturnValueOnce(new Promise(() => undefined));
    const harness = createQueryHarness(CUSTOMER_SESSION);
    await waitFor(() =>
      expect(harness.result.current.data).toEqual(firstProfile),
    );
    harness.changeSession(SIGNED_OUT_SESSION);
    expect(harness.result.current.data).toBeUndefined();
    expect(
      harness.queryClient.getQueryData(
        customerPersonalProfileQueryKeys.detail(CUSTOMER_SESSION.userId),
      ),
    ).toEqual(firstProfile);
    harness.changeSession({ ...CUSTOMER_SESSION, userId: "second-user" });
    expect(harness.result.current.data).toBeUndefined();
    expect(harness.result.current.isPending).toBe(true);
  });

  it("KAN-169 AC-10: a late A response cannot replace B or populate B's key", async () => {
    let resolveFirst!: (profile: NullableRef<CustomerPersonalProfile>) => void;
    const firstRequest = new Promise<NullableRef<CustomerPersonalProfile>>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );
    vi.mocked(fetchCustomerPersonalProfile)
      .mockReturnValueOnce(firstRequest)
      .mockResolvedValueOnce(secondProfile);
    const harness = createQueryHarness(CUSTOMER_SESSION);
    harness.changeSession({ ...CUSTOMER_SESSION, userId: "second-user" });
    await waitFor(() =>
      expect(harness.result.current.data).toEqual(secondProfile),
    );
    await act(async () => {
      resolveFirst(firstProfile);
      await firstRequest;
    });
    expect(harness.result.current.data).toEqual(secondProfile);
    expect(
      harness.queryClient.getQueryData(
        customerPersonalProfileQueryKeys.detail("second-user"),
      ),
    ).toEqual(secondProfile);
  });

  it("KAN-169 AC-10: a role change for the same UID stops exposing its cached projection", async () => {
    vi.mocked(fetchCustomerPersonalProfile).mockResolvedValue(firstProfile);
    const harness = createQueryHarness(CUSTOMER_SESSION);
    await waitFor(() =>
      expect(harness.result.current.data).toEqual(firstProfile),
    );
    harness.changeSession({ ...CUSTOMER_SESSION, role: USER_ROLE.SUBSCRIBER });
    expect(harness.result.current.data).toBeUndefined();
    expect(fetchCustomerPersonalProfile).toHaveBeenCalledTimes(1);
  });
});
