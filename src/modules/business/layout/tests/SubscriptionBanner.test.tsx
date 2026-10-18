import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BUSINESS_STATUS, SUBSCRIPTION_STATUS } from "@/domain";
import { testI18n } from "@/shared/test-utils/testI18n";
import { SubscriptionBanner } from "../components/SubscriptionBanner";

describe("SubscriptionBanner (KAN-40)", () => {
  const referenceDate = new Date("2026-11-15T12:00:00Z");

  it("KAN-40: AC-KAN-40-01 displays plan name, active status badge and renewal date without redundant action button", () => {
    render(
      <SubscriptionBanner
        businessStatus={BUSINESS_STATUS.ACTIVE}
        cancelAtPeriodEnd={false}
        currentPeriodEndsAt={referenceDate}
        isCollaborator={false}
        planName="Pro Plan"
        status={SUBSCRIPTION_STATUS.ACTIVE}
        timeZone="UTC"
      />,
    );

    expect(screen.getByText("Pro Plan")).toBeInTheDocument();
    expect(
      screen.getByText(testI18n.t("common:subscriptionStatus.active")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nov 15, 2026|15 nov 2026|15\/11\/2026/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: testI18n.t("business:layout.subscriptionBanner.viewPlan"),
      }),
    ).not.toBeInTheDocument();
  });

  it("KAN-40: AC-KAN-40-02 displays ends-on text when cancelAtPeriodEnd is true", () => {
    render(
      <SubscriptionBanner
        businessStatus={BUSINESS_STATUS.ACTIVE}
        cancelAtPeriodEnd={true}
        currentPeriodEndsAt={referenceDate}
        isCollaborator={false}
        planName="Pro Plan"
        status={SUBSCRIPTION_STATUS.ACTIVE}
        timeZone="UTC"
      />,
    );

    expect(
      screen.getByText(
        new RegExp(
          testI18n.t("business:layout.subscriptionBanner.endsOn", {
            date: ".*",
          }),
          "i",
        ),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-40: AC-KAN-40-03 displays past_due badge and pay link", async () => {
    const user = userEvent.setup();
    const handlePay = vi.fn();

    render(
      <SubscriptionBanner
        businessStatus={BUSINESS_STATUS.ACTIVE}
        isCollaborator={false}
        onPay={handlePay}
        planName="Pro Plan"
        status={SUBSCRIPTION_STATUS.PAST_DUE}
      />,
    );

    expect(
      screen.getByText(testI18n.t("common:subscriptionStatus.past_due")),
    ).toBeInTheDocument();

    const payButton = screen.getByRole("button", {
      name: testI18n.t("business:layout.subscriptionBanner.payLink"),
    });
    expect(payButton).toBeInTheDocument();

    await user.click(payButton);
    expect(handlePay).toHaveBeenCalledTimes(1);
  });

  it("KAN-40: AC-KAN-40-04 displays read-only notice and pay link for expired or cancelled subscription", () => {
    render(
      <SubscriptionBanner
        businessStatus={BUSINESS_STATUS.ACTIVE}
        isCollaborator={false}
        onPay={vi.fn()}
        planName="Pro Plan"
        status={SUBSCRIPTION_STATUS.EXPIRED}
      />,
    );

    expect(
      screen.getByText(testI18n.t("common:subscriptionStatus.expired")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        testI18n.t("business:layout.subscriptionBanner.readOnlyNotice"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: testI18n.t("business:layout.subscriptionBanner.payLink"),
      }),
    ).toBeInTheDocument();
  });

  it("KAN-40: AC-KAN-40-05 displays load error with retry button on network error", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();

    render(
      <SubscriptionBanner
        isCollaborator={false}
        isError={true}
        onRetry={handleRetry}
      />,
    );

    expect(
      screen.getByText(
        testI18n.t("business:layout.subscriptionBanner.loadError"),
      ),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole("button", {
      name: testI18n.t("business:layout.subscriptionBanner.retry"),
    });
    await user.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("KAN-40: AC-KAN-40-06 updates banner when status changes", () => {
    const { rerender } = render(
      <SubscriptionBanner
        businessStatus={BUSINESS_STATUS.ACTIVE}
        isCollaborator={false}
        onPay={vi.fn()}
        planName="Pro Plan"
        status={SUBSCRIPTION_STATUS.PAST_DUE}
      />,
    );

    expect(
      screen.getByText(testI18n.t("common:subscriptionStatus.past_due")),
    ).toBeInTheDocument();

    rerender(
      <SubscriptionBanner
        businessStatus={BUSINESS_STATUS.ACTIVE}
        currentPeriodEndsAt={referenceDate}
        isCollaborator={false}
        planName="Pro Plan"
        status={SUBSCRIPTION_STATUS.ACTIVE}
      />,
    );

    expect(
      screen.getByText(testI18n.t("common:subscriptionStatus.active")),
    ).toBeInTheDocument();
  });

  it("KAN-40: AC-KAN-40-07 displays suspended notice and no pay link when business is suspended", () => {
    render(
      <SubscriptionBanner
        businessStatus={BUSINESS_STATUS.SUSPENDED}
        isCollaborator={false}
        onPay={vi.fn()}
        planName="Pro Plan"
        status={SUBSCRIPTION_STATUS.PAST_DUE}
      />,
    );

    expect(
      screen.getByText(
        testI18n.t("business:layout.subscriptionBanner.suspendedNotice"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: testI18n.t("business:layout.subscriptionBanner.payLink"),
      }),
    ).not.toBeInTheDocument();
  });

  it("KAN-40: AC-KAN-40-08 renders null for collaborator", () => {
    const { container } = render(
      <SubscriptionBanner
        businessStatus={BUSINESS_STATUS.ACTIVE}
        isCollaborator={true}
        planName="Pro Plan"
        status={SUBSCRIPTION_STATUS.ACTIVE}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
