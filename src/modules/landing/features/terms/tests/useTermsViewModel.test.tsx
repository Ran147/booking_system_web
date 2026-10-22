import { renderHook } from "@testing-library/react";
import type { FC, ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { testI18n } from "@/shared/test-utils/testI18n";
import { TERMS_CONSTANTS } from "../constants/Terms.constants";
import { useTermsViewModel } from "../hooks/useTermsViewModel";

const createWrapper = (): FC<{ children: ReactNode }> => {
  const TestWrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <I18nextProvider i18n={testI18n}>
      <MemoryRouter initialEntries={[ROUTE_PATH.LANDING.TERMS]}>
        {children}
      </MemoryRouter>
    </I18nextProvider>
  );
  TestWrapper.displayName = "TermsTestWrapper";
  return TestWrapper;
};

describe("useTermsViewModel", () => {
  it("provides translated labels and legal clauses", () => {
    const { result } = renderHook(() => useTermsViewModel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.title).toBe(testI18n.t("landing:terms.title"));
    expect(result.current.lastUpdated).toBe(
      testI18n.t("landing:terms.lastUpdated"),
    );
    expect(result.current.backToHomeLabel).toBe(
      testI18n.t("landing:terms.backToHome"),
    );
    expect(result.current.clauses).toHaveLength(TERMS_CONSTANTS.CLAUSES.length);
    const firstClause = result.current.clauses[0];
    const expectedFirstClause = TERMS_CONSTANTS.CLAUSES[0];
    expect(firstClause).toBeDefined();
    expect(expectedFirstClause).toBeDefined();
    if (!firstClause || !expectedFirstClause) {
      return;
    }
    expect(firstClause.id).toBe(expectedFirstClause.ID);
    expect(firstClause.title).toBe(
      testI18n.t(`landing:${expectedFirstClause.TITLE_KEY}`),
    );
    expect(firstClause.body).toBe(
      testI18n.t(`landing:${expectedFirstClause.BODY_KEY}`),
    );
  });
});
