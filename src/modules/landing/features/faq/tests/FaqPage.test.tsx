import type * as ReactRouter from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/shared/test-utils";
import { testI18n } from "@/test-utils/testI18n";
import { createFaqPageObject } from "./FaqPage.page";
import { FaqPage } from "../FaqPage";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof ReactRouter>("react-router");
  return {
    ...actual,
    useNavigate: (): typeof mockNavigate => mockNavigate,
  };
});

describe("FaqPage (US-18 / KAN-18)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("KAN-18: AC-KAN-18-01 toggles answer visibility and updates aria-expanded state", async () => {
    renderWithProviders(<FaqPage />, {
      initialPath: ROUTE_PATH.LANDING.FAQ,
      session: SIGNED_OUT_SESSION,
    });

    const page = createFaqPageObject();
    const questionText = testI18n.t(
      "landing:faq.groups.servicesAndBookings.items.clientBooking.question",
    );
    const answerText = testI18n.t(
      "landing:faq.groups.servicesAndBookings.items.clientBooking.answer",
    );

    const questionButton = page.getQuestionButton(questionText);
    expect(questionButton).toHaveAttribute("aria-expanded", "false");
    expect(page.queryAnswer(answerText)).toBeNull();

    await page.clickQuestion(questionText);
    expect(questionButton).toHaveAttribute("aria-expanded", "true");
    expect(page.getAnswer(answerText)).toBeInTheDocument();

    await page.clickQuestion(questionText);
    expect(questionButton).toHaveAttribute("aria-expanded", "false");
    expect(page.queryAnswer(answerText)).toBeNull();
  });

  it("KAN-18: AC-KAN-18-02 renders categorized group headings and main header", () => {
    renderWithProviders(<FaqPage />, {
      initialPath: ROUTE_PATH.LANDING.FAQ,
      session: SIGNED_OUT_SESSION,
    });

    const page = createFaqPageObject();

    expect(page.getMainHeading()).toBeInTheDocument();
    expect(page.getDescription()).toBeInTheDocument();

    const groupHeadings = page.getGroupHeadings();
    expect(groupHeadings.length).toBeGreaterThanOrEqual(3);

    const expectedTitles = [
      testI18n.t("landing:faq.groups.servicesAndBookings.title"),
      testI18n.t("landing:faq.groups.plansAndBilling.title"),
      testI18n.t("landing:faq.groups.accountAndSecurity.title"),
    ];

    expectedTitles.forEach((title) => {
      expect(
        groupHeadings.some((heading) => heading.textContent?.includes(title)),
      ).toBe(true);
    });
  });

  it("KAN-18: AC-KAN-18-04 navigates to contact page when activating cta button", async () => {
    renderWithProviders(<FaqPage />, {
      initialPath: ROUTE_PATH.LANDING.FAQ,
      session: SIGNED_OUT_SESSION,
    });

    const page = createFaqPageObject();
    expect(page.getContactCtaButton()).toBeInTheDocument();

    await page.clickContactCtaButton();
    expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATH.LANDING.CONTACT);
  });

  it("KAN-18: AC-KAN-18-05 links button and content with aria-controls", async () => {
    renderWithProviders(<FaqPage />, {
      initialPath: ROUTE_PATH.LANDING.FAQ,
      session: SIGNED_OUT_SESSION,
    });

    const page = createFaqPageObject();
    const questionText = testI18n.t(
      "landing:faq.groups.plansAndBilling.items.changePlan.question",
    );
    const questionButton = page.getQuestionButton(questionText);
    const controlsId = questionButton.getAttribute("aria-controls");

    expect(controlsId).toBeTruthy();

    await page.clickQuestion(questionText);

    const answerRegion = document.getElementById(controlsId as string);
    expect(answerRegion).toBeInTheDocument();
  });
});
