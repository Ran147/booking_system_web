import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  renderHook,
  type RenderHookResult,
  waitFor,
} from "@testing-library/react";
import { signOut } from "firebase/auth";
import type { ReactElement, ReactNode } from "react";
import { FIRESTORE_COLLECTION } from "@/constants";
import { planDetailQueryKeys } from "../api/planDetailQueryKeys";
import { useSignOutMutation } from "../api/useSignOutMutation";

vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  signOut: vi.fn(),
}));

const PRIVATE_QUERY_KEY = [FIRESTORE_COLLECTION.USERS, "subscriber-1"];

const renderSignOutMutation = (
  queryClient: QueryClient,
): RenderHookResult<ReturnType<typeof useSignOutMutation>, unknown> => {
  const TestWrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useSignOutMutation(), { wrapper: TestWrapper });
};

describe("useSignOutMutation (KAN-21)", () => {
  beforeEach(() => {
    vi.mocked(signOut).mockReset().mockResolvedValue();
  });

  it("KAN-21: AC-KAN-21-11 removes the cached data of the user who signed out and keeps the plans on screen", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(PRIVATE_QUERY_KEY, { fullName: "Ana" });
    queryClient.setQueryData(planDetailQueryKeys.active(), []);
    const { result } = renderSignOutMutation(queryClient);

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(queryClient.getQueryData(PRIVATE_QUERY_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(planDetailQueryKeys.active())).toEqual([]);
  });

  it("KAN-21: AC-KAN-21-11 keeps the cache when signing out fails", async () => {
    vi.mocked(signOut).mockRejectedValue(new Error("auth/network-request"));
    const queryClient = new QueryClient();
    queryClient.setQueryData(PRIVATE_QUERY_KEY, { fullName: "Ana" });
    const { result } = renderSignOutMutation(queryClient);

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(queryClient.getQueryData(PRIVATE_QUERY_KEY)).toEqual({
      fullName: "Ana",
    });
  });
});
