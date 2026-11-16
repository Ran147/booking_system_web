import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { JSX, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { type SupportTicket, SUPPORT_TICKET_STATUS } from "@/domain";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { SUBSCRIBER_SESSION, testI18n } from "@/test-utils";
import { useSupportTicketsViewModel } from "../hooks/useSupportTicketsViewModel";

const MOCK_TICKET: SupportTicket = {
  businessId: "business-test",
  businessName: "Barbería Elite",
  createdAt: new Date("2026-11-15T12:00:00.000Z"),
  createdByUserId: "subscriber-test",
  id: "ticket-1",
  message: "Mensaje de prueba",
  ownerEmail: "owner@test.com",
  replies: [],
  resolvedAt: null,
  status: SUPPORT_TICKET_STATUS.OPEN,
  subject: "Asunto de prueba",
  updatedAt: new Date("2026-11-15T12:00:00.000Z"),
};

interface TestWrapperProps {
  readonly children: ReactNode;
}

type TestWrapperComponent = (props: TestWrapperProps) => JSX.Element;

const createTestWrapper = (): TestWrapperComponent => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  const TestWrapper = ({ children }: TestWrapperProps): JSX.Element => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={testI18n}>
        <AuthContext.Provider value={{ session: SUBSCRIBER_SESSION }}>
          {children}
        </AuthContext.Provider>
      </I18nextProvider>
    </QueryClientProvider>
  );
  TestWrapper.displayName = "TestWrapper";

  return TestWrapper;
};

describe("useSupportTicketsViewModel", () => {
  it("maneja la apertura y cierre del modal de creación", () => {
    const { result } = renderHook(() => useSupportTicketsViewModel(), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.isCreateModalOpen).toBe(false);

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isCreateModalOpen).toBe(true);

    act(() => {
      result.current.closeCreateModal();
    });

    expect(result.current.isCreateModalOpen).toBe(false);
  });

  it("maneja la selección de ticket para abrir y cerrar el drawer de detalle", () => {
    const { result } = renderHook(() => useSupportTicketsViewModel(), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.selectedTicket).toBeNull();
    expect(result.current.isDetailDrawerOpen).toBe(false);

    act(() => {
      result.current.openDetailDrawer(MOCK_TICKET);
    });

    expect(result.current.selectedTicket).toEqual(MOCK_TICKET);
    expect(result.current.isDetailDrawerOpen).toBe(true);

    act(() => {
      result.current.closeDetailDrawer();
    });

    expect(result.current.selectedTicket).toBeNull();
    expect(result.current.isDetailDrawerOpen).toBe(false);
  });

  it("formatea la fecha correctamente recibiendo un string o Date", () => {
    const { result } = renderHook(() => useSupportTicketsViewModel(), {
      wrapper: createTestWrapper(),
    });

    const formattedFromString = result.current.formatDateTime(
      "2026-11-15T12:00:00.000Z",
    );
    expect(formattedFromString).toBeDefined();
    expect(formattedFromString.length).toBeGreaterThan(0);

    const formattedFromDate = result.current.formatDateTime(
      new Date("2026-11-15T12:00:00.000Z"),
    );
    expect(formattedFromDate).toBe(formattedFromString);
  });
});
