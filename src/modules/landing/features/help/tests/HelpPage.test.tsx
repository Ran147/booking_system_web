import type * as ReactRouter from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import {
  renderWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
} from "@/shared/test-utils";
import { testI18n } from "@/test-utils/testI18n";
import { createHelpPageObject } from "./HelpPage.page";
import { HelpPage } from "../HelpPage";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof ReactRouter>("react-router");
  return {
    ...actual,
    useNavigate: (): typeof mockNavigate => mockNavigate,
  };
});

describe("HelpPage (US-19 / KAN-19)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("KAN-19: AC-KAN-19-01 renders title, description, topics and direct contact and faq links", () => {
    renderWithProviders(<HelpPage />, {
      initialPath: ROUTE_PATH.LANDING.HELP,
      session: SIGNED_OUT_SESSION,
    });

    const page = createHelpPageObject();

    expect(page.getMainHeading()).toBeInTheDocument();
    expect(page.getDescription()).toBeInTheDocument();

    expect(
      page.getTopicCardByTitle(
        testI18n.t("landing:help.topics.gettingStarted.title"),
      ),
    ).toBeInTheDocument();
    expect(
      page.getTopicCardByTitle(
        testI18n.t("landing:help.topics.managingSchedule.title"),
      ),
    ).toBeInTheDocument();
    expect(
      page.getTopicCardByTitle(
        testI18n.t("landing:help.topics.subscriptionsAndPlans.title"),
      ),
    ).toBeInTheDocument();

    expect(page.getContactButton()).toBeInTheDocument();
    expect(page.getFaqButton()).toBeInTheDocument();
  });

  it("KAN-19: AC-KAN-19-02 displays priority support tickets option for signed-in subscriber", async () => {
    renderWithProviders(<HelpPage />, {
      initialPath: ROUTE_PATH.LANDING.HELP,
      session: SUBSCRIBER_SESSION,
    });

    const page = createHelpPageObject();

    expect(page.querySubscriberSupportCard()).toBeInTheDocument();
    expect(page.getSupportTicketsButton()).toBeInTheDocument();

    await page.clickSupportTicketsButton();
    expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATH.BUSINESS.ROOT);
  });

  it("KAN-19: AC-KAN-19-03 hides subscriber support tickets option for public visitor", () => {
    renderWithProviders(<HelpPage />, {
      initialPath: ROUTE_PATH.LANDING.HELP,
      session: SIGNED_OUT_SESSION,
    });

    const page = createHelpPageObject();

    expect(page.querySubscriberSupportCard()).toBeNull();
    expect(page.getPublicSupportCard()).toBeInTheDocument();
  });

  it("KAN-19: AC-KAN-19-04 applies semantic structure and design tokens", () => {
    renderWithProviders(<HelpPage />, {
      initialPath: ROUTE_PATH.LANDING.HELP,
      session: SIGNED_OUT_SESSION,
    });

    const page = createHelpPageObject();
    const publicCard = page.getPublicSupportCard();

    expect(publicCard).toHaveClass("bg-card");
    expect(publicCard).toHaveClass("border-border");
  });

  it("KAN-19: AC-KAN-19-05 triggers navigation when clicking contact or faq buttons", async () => {
    renderWithProviders(<HelpPage />, {
      initialPath: ROUTE_PATH.LANDING.HELP,
      session: SIGNED_OUT_SESSION,
    });

    const page = createHelpPageObject();

    await page.clickContactButton();
    expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATH.LANDING.CONTACT);

    await page.clickFaqButton();
    expect(mockNavigate).toHaveBeenCalledWith(
      `${ROUTE_PATH.LANDING.CONTACT}#faq`,
    );
  });
});
