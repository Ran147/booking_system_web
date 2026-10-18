import type * as ReactRouter from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createTermsPageObject } from "./TermsPage.page";
import { TermsPage } from "../TermsPage";
import { TERMS_CONSTANTS } from "../constants/Terms.constants";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof ReactRouter>("react-router");
  return {
    ...actual,
    useNavigate: (): typeof mockNavigate => mockNavigate,
  };
});

describe("TermsPage (US-09 / KAN-9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("KAN-9: AC-KAN-9-01 renders title, last updated date, back to home button, and legal clauses", () => {
    renderWithProviders(<TermsPage />, {
      initialPath: ROUTE_PATH.LANDING.TERMS,
      session: SIGNED_OUT_SESSION,
    });

    const page = createTermsPageObject();

    expect(page.getMainHeading()).toBeInTheDocument();
    expect(page.getLastUpdated()).toBeInTheDocument();
    expect(page.getBackToHomeButton()).toBeInTheDocument();

    const clauseHeadings = page.getAllClauseHeadings();
    expect(clauseHeadings).toHaveLength(TERMS_CONSTANTS.CLAUSES.length);

    TERMS_CONSTANTS.CLAUSES.forEach((clause) => {
      const clauseTitle = testI18n.t(`landing:${clause.TITLE_KEY}`);
      const clauseBody = testI18n.t(`landing:${clause.BODY_KEY}`);

      expect(clauseTitle).toBeTruthy();
      expect(clauseBody).toBeTruthy();
    });
  });

  it("KAN-9: AC-KAN-9-02 navigates to home when clicking back to home button", async () => {
    renderWithProviders(<TermsPage />, {
      initialPath: ROUTE_PATH.LANDING.TERMS,
      session: SIGNED_OUT_SESSION,
    });

    const page = createTermsPageObject();
    await page.clickBackToHomeButton();

    expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATH.LANDING.HOME);
  });

  it("KAN-9: AC-KAN-9-03 renders for unauthenticated visitor without redirects or barriers", () => {
    renderWithProviders(<TermsPage />, {
      initialPath: ROUTE_PATH.LANDING.TERMS,
      session: SIGNED_OUT_SESSION,
    });

    const page = createTermsPageObject();

    expect(page.getMainHeading()).toBeInTheDocument();
    expect(page.getLastUpdated()).toBeInTheDocument();
  });

  it("KAN-9: AC-KAN-9-04 applies semantic structure, responsive container, and design tokens", () => {
    renderWithProviders(<TermsPage className="custom-terms-class" />, {
      initialPath: ROUTE_PATH.LANDING.TERMS,
      session: SIGNED_OUT_SESSION,
    });

    const page = createTermsPageObject();
    const container = page.getContainer();

    expect(container).toHaveClass("custom-terms-class");
    expect(container).toHaveClass("max-w-4xl");
    expect(page.getMainHeading().tagName).toBe("H1");
  });
});
