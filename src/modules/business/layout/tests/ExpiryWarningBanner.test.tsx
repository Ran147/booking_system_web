import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SUBSCRIPTION_STATUS } from "@/domain";
import { testI18n } from "@/shared/test-utils/testI18n";
import { ExpiryWarningBanner } from "../components/ExpiryWarningBanner";

describe("ExpiryWarningBanner (KAN-41)", () => {
  const referenceDate = new Date("2026-11-10T12:00:00Z");
  const fiveDaysLater = new Date("2026-11-15T12:00:00Z");
  const sameDayDate = new Date("2026-11-10T18:00:00Z");

  it("KAN-41: AC-KAN-41-01 displays warning banner with remaining days and end date when within 7 days", () => {
    render(
      <ExpiryWarningBanner
        cancelAtPeriodEnd={true}
        currentPeriodEndsAt={fiveDaysLater}
        isCollaborator={false}
        referenceDate={referenceDate}
        status={SUBSCRIPTION_STATUS.ACTIVE}
        timeZone="UTC"
      />,
    );

    expect(
      screen.getByText(
        new RegExp(
          testI18n.t("business:layout.expiryWarning.message", {
            count: 5,
            date: ".*",
          }),
          "i",
        ),
      ),
    ).toBeInTheDocument();
  });

  it("KAN-41: AC-KAN-41-03 renders nothing with guessed dates when subscription error occurs", () => {
    const { container } = render(
      <ExpiryWarningBanner
        isCollaborator={false}
        isSubscriptionError={true}
        status={SUBSCRIPTION_STATUS.ACTIVE}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("KAN-41: AC-KAN-41-04 renders nothing when active subscription auto-renews (cancelAtPeriodEnd false)", () => {
    const { container } = render(
      <ExpiryWarningBanner
        cancelAtPeriodEnd={false}
        currentPeriodEndsAt={fiveDaysLater}
        isCollaborator={false}
        referenceDate={referenceDate}
        status={SUBSCRIPTION_STATUS.ACTIVE}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("KAN-41: AC-KAN-41-05 displays ends today when target date is today in business timeZone", () => {
    render(
      <ExpiryWarningBanner
        cancelAtPeriodEnd={true}
        currentPeriodEndsAt={sameDayDate}
        isCollaborator={false}
        referenceDate={referenceDate}
        status={SUBSCRIPTION_STATUS.ACTIVE}
        timeZone="UTC"
      />,
    );

    expect(
      screen.getByText(testI18n.t("business:layout.expiryWarning.endsToday")),
    ).toBeInTheDocument();
  });

  it("KAN-41: AC-KAN-41-06 allows subscriber to dismiss warning banner", async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();

    const { rerender } = render(
      <ExpiryWarningBanner
        cancelAtPeriodEnd={true}
        currentPeriodEndsAt={fiveDaysLater}
        isCollaborator={false}
        isDismissed={false}
        onDismiss={handleDismiss}
        referenceDate={referenceDate}
        status={SUBSCRIPTION_STATUS.ACTIVE}
        timeZone="UTC"
      />,
    );

    const dismissButton = screen.getByRole("button", {
      name: testI18n.t("business:layout.expiryWarning.dismiss"),
    });
    await user.click(dismissButton);
    expect(handleDismiss).toHaveBeenCalledTimes(1);

    rerender(
      <ExpiryWarningBanner
        cancelAtPeriodEnd={true}
        currentPeriodEndsAt={fiveDaysLater}
        isCollaborator={false}
        isDismissed={true}
        onDismiss={handleDismiss}
        referenceDate={referenceDate}
        status={SUBSCRIPTION_STATUS.ACTIVE}
        timeZone="UTC"
      />,
    );

    expect(
      screen.queryByText(
        new RegExp(
          testI18n.t("business:layout.expiryWarning.message", {
            count: 5,
            date: ".*",
          }),
          "i",
        ),
      ),
    ).not.toBeInTheDocument();
  });

  it("KAN-41: AC-KAN-41-07 displays grace period countdown and pay button for past_due subscription", async () => {
    const user = userEvent.setup();
    const handlePay = vi.fn();

    render(
      <ExpiryWarningBanner
        currentPeriodEndsAt={referenceDate}
        gracePeriodDays={7}
        isCollaborator={false}
        onPay={handlePay}
        referenceDate={referenceDate}
        status={SUBSCRIPTION_STATUS.PAST_DUE}
        timeZone="UTC"
      />,
    );

    expect(
      screen.getByText(
        new RegExp(
          testI18n.t("business:layout.expiryWarning.pastDue", {
            count: 7,
            date: ".*",
          }),
          "i",
        ),
      ),
    ).toBeInTheDocument();

    const payButton = screen.getByRole("button", {
      name: testI18n.t("business:layout.expiryWarning.payLink"),
    });
    await user.click(payButton);
    expect(handlePay).toHaveBeenCalledTimes(1);

    // Cannot be dismissed
    expect(
      screen.queryByRole("button", {
        name: testI18n.t("business:layout.expiryWarning.dismiss"),
      }),
    ).not.toBeInTheDocument();
  });

  it("KAN-41: AC-KAN-41-08 displays past due notice without guessed countdown when platform settings fail", () => {
    render(
      <ExpiryWarningBanner
        currentPeriodEndsAt={referenceDate}
        gracePeriodDays={null}
        isCollaborator={false}
        isPlatformSettingsError={true}
        onPay={vi.fn()}
        status={SUBSCRIPTION_STATUS.PAST_DUE}
      />,
    );

    expect(
      screen.getByText(
        testI18n.t("business:layout.expiryWarning.pastDueNoCountdown"),
      ),
    ).toBeInTheDocument();
  });
});
