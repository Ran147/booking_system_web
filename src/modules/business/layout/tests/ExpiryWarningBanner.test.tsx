import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SUBSCRIPTION_STATUS } from "@/domain";
import { testI18n } from "@/shared/test-utils/testI18n";
import { ExpiryWarningBanner } from "../components/ExpiryWarningBanner";
import { calculateExpiryWarning } from "../utils/calculateExpiryWarning";

describe("ExpiryWarningBanner (KAN-41)", () => {
  const referenceDate = new Date("2026-11-10T12:00:00Z");
  const fiveDaysLater = new Date("2026-11-15T12:00:00Z");
  const sameDayDate = new Date("2026-11-10T18:00:00Z");
  const translate = (key: string, options?: Record<string, unknown>): string =>
    testI18n.t(`business:${key}` as never, options);

  describe("Presentation: ExpiryWarningBanner component", () => {
    it("KAN-41: AC-KAN-41-01 renders warning banner with status role and view plan button", async () => {
      const user = userEvent.setup();
      const handleNavigate = vi.fn();

      render(
        <ExpiryWarningBanner
          canDismiss={true}
          message="Tu suscripción termina en 5 días."
          onNavigateToSubscription={handleNavigate}
          type="active_ending_soon"
        />,
      );

      const statusRegion = screen.getByRole("status");
      expect(statusRegion).toBeInTheDocument();
      expect(
        screen.getByText("Tu suscripción termina en 5 días."),
      ).toBeInTheDocument();

      const viewPlanButton = screen.getByRole("button", {
        name: testI18n.t("business:layout.subscriptionBanner.viewPlan"),
      });
      await user.click(viewPlanButton);
      expect(handleNavigate).toHaveBeenCalledTimes(1);
    });

    it("KAN-41: AC-KAN-41-03 renders nothing when type or message is null", () => {
      const { container } = render(
        <ExpiryWarningBanner message={null} type={null} />,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("KAN-41: AC-KAN-41-06 allows subscriber to dismiss active warning banner", async () => {
      const user = userEvent.setup();
      const handleDismiss = vi.fn();

      render(
        <ExpiryWarningBanner
          canDismiss={true}
          message="Aviso de prueba"
          onDismiss={handleDismiss}
          type="active_ending_soon"
        />,
      );

      const dismissButton = screen.getByRole("button", {
        name: testI18n.t("business:layout.expiryWarning.dismiss"),
      });
      await user.click(dismissButton);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it("KAN-41: AC-KAN-41-07 renders past_due banner with pay button and no dismiss option", async () => {
      const user = userEvent.setup();
      const handlePay = vi.fn();

      render(
        <ExpiryWarningBanner
          canDismiss={false}
          message="Tu suscripción está vencida."
          onPay={handlePay}
          type="past_due"
        />,
      );

      expect(
        screen.getByText("Tu suscripción está vencida."),
      ).toBeInTheDocument();

      const payButton = screen.getByRole("button", {
        name: testI18n.t("business:layout.expiryWarning.payLink"),
      });
      await user.click(payButton);
      expect(handlePay).toHaveBeenCalledTimes(1);

      expect(
        screen.queryByRole("button", {
          name: testI18n.t("business:layout.expiryWarning.dismiss"),
        }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Business Logic: calculateExpiryWarning", () => {
    it("KAN-41: AC-KAN-41-01 calculates active_ending_soon when within 7 days", () => {
      const warning = calculateExpiryWarning({
        cancelAtPeriodEnd: true,
        currentPeriodEndsAt: fiveDaysLater,
        language: "es",
        referenceDate,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        t: translate,
        timeZone: "UTC",
      });

      expect(warning).not.toBeNull();
      expect(warning?.type).toBe("active_ending_soon");
      expect(warning?.canDismiss).toBe(true);
      expect(warning?.message).toMatch(/5/);
    });

    it("KAN-41: AC-KAN-41-03 returns null when subscription error occurs", () => {
      const warning = calculateExpiryWarning({
        currentPeriodEndsAt: fiveDaysLater,
        isSubscriptionError: true,
        language: "es",
        status: SUBSCRIPTION_STATUS.ACTIVE,
        t: translate,
        timeZone: "UTC",
      });

      expect(warning).toBeNull();
    });

    it("KAN-41: AC-KAN-41-04 returns null when active subscription auto-renews", () => {
      const warning = calculateExpiryWarning({
        cancelAtPeriodEnd: false,
        currentPeriodEndsAt: fiveDaysLater,
        language: "es",
        referenceDate,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        t: translate,
        timeZone: "UTC",
      });

      expect(warning).toBeNull();
    });

    it("KAN-41: AC-KAN-41-05 returns endsToday when target date is today in business timeZone", () => {
      const warning = calculateExpiryWarning({
        cancelAtPeriodEnd: true,
        currentPeriodEndsAt: sameDayDate,
        language: "es",
        referenceDate,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        t: translate,
        timeZone: "UTC",
      });

      expect(warning?.message).toBe(
        testI18n.t("business:layout.expiryWarning.endsToday"),
      );
    });

    it("KAN-41: AC-KAN-41-06 returns null when warning is dismissed", () => {
      const warning = calculateExpiryWarning({
        cancelAtPeriodEnd: true,
        currentPeriodEndsAt: fiveDaysLater,
        isDismissed: true,
        language: "es",
        referenceDate,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        t: translate,
        timeZone: "UTC",
      });

      expect(warning).toBeNull();
    });

    it("KAN-41: AC-KAN-41-07 returns past_due with grace countdown", () => {
      const warning = calculateExpiryWarning({
        currentPeriodEndsAt: referenceDate,
        gracePeriodDays: 7,
        language: "es",
        referenceDate,
        status: SUBSCRIPTION_STATUS.PAST_DUE,
        t: translate,
        timeZone: "UTC",
      });

      expect(warning).not.toBeNull();
      expect(warning?.type).toBe("past_due");
      expect(warning?.canDismiss).toBe(false);
      expect(warning?.message).toMatch(/7/);
    });

    it("KAN-41: AC-KAN-41-08 returns pastDueNoCountdown when platform settings error occurs", () => {
      const warning = calculateExpiryWarning({
        currentPeriodEndsAt: referenceDate,
        gracePeriodDays: null,
        isPlatformSettingsError: true,
        language: "es",
        status: SUBSCRIPTION_STATUS.PAST_DUE,
        t: translate,
        timeZone: "UTC",
      });

      expect(warning?.type).toBe("past_due");
      expect(warning?.message).toBe(
        testI18n.t("business:layout.expiryWarning.pastDueNoCountdown"),
      );
    });

    it("KAN-41: AC-KAN-40-08 returns null for collaborator (AS-10)", () => {
      const warning = calculateExpiryWarning({
        cancelAtPeriodEnd: true,
        currentPeriodEndsAt: fiveDaysLater,
        isCollaborator: true,
        language: "es",
        status: SUBSCRIPTION_STATUS.ACTIVE,
        t: translate,
        timeZone: "UTC",
      });

      expect(warning).toBeNull();
    });

    it("KAN-41: returns null when remaining days exceed 7 days (AS-4)", () => {
      const eightDaysLater = new Date("2026-11-18T12:00:00Z");
      const warning = calculateExpiryWarning({
        cancelAtPeriodEnd: true,
        currentPeriodEndsAt: eightDaysLater,
        language: "es",
        referenceDate,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        t: translate,
        timeZone: "UTC",
      });

      expect(warning).toBeNull();
    });
  });
});
