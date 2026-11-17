import { screen } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { FunctionsError } from "firebase/functions";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as FirebaseServices from "@/services/firebase";
import { CUSTOMER_SESSION, renderRoutesWithProviders } from "@/test-utils";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";
import { formatPrice } from "@/utils";
import { createBookingCheckoutPage } from "./BookingCheckoutPage.page";
import * as fetchCheckoutSummaryModule from "../api/fetchCheckoutSummary";
import { BookingCheckoutPage } from "../components/BookingCheckoutPage/BookingCheckoutPage";
import type { CheckoutSummary } from "../models/bookingCheckout.model";

const callFunctionMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/firebase", async (importOriginal) => ({
  ...(await importOriginal<typeof FirebaseServices>()),
  callFunction: callFunctionMock,
}));

const STARTS_AT = "2026-11-20T15:00:00.000Z";
const CHECKOUT_PATH = `/barberia-centro/book/service-1/confirm?startsAt=${STARTS_AT}`;
const SUMMARY: CheckoutSummary = {
  basePriceInCents: 25_000,
  businessId: "business-1",
  businessName: "Barbería Centro",
  currency: "CRC",
  durationMinutes: 45,
  finalPriceInCents: 25_000,
  hasCollaborators: false,
  policy: null,
  serviceName: "Corte de cabello",
  timeZone: "America/Costa_Rica",
};

const reasonError = (reason: string): FunctionsError =>
  new FunctionsError("failed-precondition", "message", { reason });

const mockSummary = (
  summary: Nullable<CheckoutSummary> = SUMMARY,
): ReturnType<typeof vi.spyOn> =>
  vi
    .spyOn(fetchCheckoutSummaryModule, "fetchCheckoutSummary")
    .mockResolvedValue(summary);

const renderPage = (): ReturnType<typeof renderRoutesWithProviders> =>
  renderRoutesWithProviders(
    [
      {
        element: <BookingCheckoutPage />,
        path: "/:businessSlug/book/:serviceId/confirm",
      },
      {
        element: <p>done step</p>,
        path: "/:businessSlug/book/done/:bookingId",
      },
      {
        element: <p>availability step</p>,
        path: "/:businessSlug/book/:serviceId",
      },
      { element: <p>services step</p>, path: "/:businessSlug/book" },
    ],
    { initialPath: CHECKOUT_PATH, session: CUSTOMER_SESSION },
  );

// toHaveTextContent collapses the no-break space of Intl into a plain one.
const price = (priceInCents: number): string =>
  formatPrice(priceInCents, "CRC", testI18n.language).replace(/\s/gu, " ");

describe("BookingCheckoutPage (KAN-146 to KAN-148)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    callFunctionMock.mockReset();
  });

  it("AC-KAN-146-01 and AC-KAN-146-05: shows the booking in the business time zone", async () => {
    mockSummary();
    const page = createBookingCheckoutPage();

    renderPage();

    const summary = await page.findSummary();
    expect(summary).toHaveTextContent("Barbería Centro");
    expect(summary).toHaveTextContent("Corte de cabello");
    // 15:00 UTC is 09:00 in Costa Rica; it ends 45 minutes later.
    expect(summary).toHaveTextContent(/9:00.*9:45/);
    expect(summary).toHaveTextContent(price(25_000));
    expect(summary).toHaveTextContent(
      testI18n.t("customer:bookingCheckout.summary.timeZoneNote", {
        timeZone: "America/Costa_Rica",
      }),
    );
  });

  it("AC-KAN-146-06: with a discount shows the original price and the discounted one", async () => {
    mockSummary({ ...SUMMARY, finalPriceInCents: 20_000 });
    const page = createBookingCheckoutPage();

    renderPage();

    const summary = await page.findSummary();
    expect(summary).toHaveTextContent(price(20_000));
    expect(
      screen.getByLabelText(
        testI18n.t("customer:bookingCheckout.summary.originalPrice", {
          price: price(25_000),
        }),
      ),
    ).toBeInTheDocument();
  });

  it("AC-KAN-146-07: a service with collaborators shows any available person", async () => {
    mockSummary({ ...SUMMARY, hasCollaborators: true });
    const page = createBookingCheckoutPage();

    renderPage();

    expect(await page.findSummary()).toHaveTextContent(
      testI18n.t("customer:bookingCheckout.summary.anyCollaborator"),
    );
  });

  it("AC-KAN-147-03: without a policy says so and asks for no acknowledgement", async () => {
    mockSummary();
    const page = createBookingCheckoutPage();

    renderPage();

    expect(
      await screen.findByText(
        testI18n.t("customer:bookingCheckout.policies.noPolicyEmpty"),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(await page.findConfirmButton()).toBeEnabled();
  });

  it("AC-KAN-147-01 and AC-KAN-147-02: a policy is shown and must be acknowledged first", async () => {
    mockSummary({
      ...SUMMARY,
      policy: { cancellationWindowHours: 24, penaltyDescription: "50 %" },
    });
    const page = createBookingCheckoutPage();

    renderPage();

    expect(
      await screen.findByText(
        testI18n.t("customer:bookingCheckout.policies.window", { hours: 24 }),
      ),
    ).toBeInTheDocument();
    expect(await page.findConfirmButton()).toBeDisabled();
    await page.acknowledgePolicy();
    expect(await page.findConfirmButton()).toBeEnabled();
  });

  it("AC-KAN-146-04: a missing or inactive service shows not found and no confirm", async () => {
    mockSummary(null);

    renderPage();

    expect(
      await screen.findByText(testI18n.t("errors.notFound")),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: testI18n.t("customer:bookingCheckout.confirm.action"),
      }),
    ).not.toBeInTheDocument();
  });

  it("AC-KAN-148-01: confirms with what the customer saw and opens the confirmation", async () => {
    mockSummary();
    callFunctionMock.mockResolvedValue({
      bookingId: "booking-9",
      status: "confirmed",
    });
    const page = createBookingCheckoutPage();

    const { router } = renderPage();

    await page.clickConfirm();
    expect(callFunctionMock).toHaveBeenCalledWith(
      "createBooking",
      expect.objectContaining({
        businessId: "business-1",
        expectedDurationMinutes: 45,
        expectedPriceInCents: 25_000,
        requestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
        serviceId: "service-1",
        startsAt: STARTS_AT,
      }),
    );
    expect(await screen.findByText("done step")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      "/barberia-centro/book/done/booking-9",
    );
  });

  it("AC-KAN-148-08: with a discount, confirms with the discounted price the customer saw", async () => {
    mockSummary({ ...SUMMARY, finalPriceInCents: 20_000 });
    callFunctionMock.mockResolvedValue({
      bookingId: "booking-9",
      status: "confirmed",
    });
    const page = createBookingCheckoutPage();

    renderPage();

    await page.clickConfirm();
    expect(callFunctionMock).toHaveBeenCalledWith(
      "createBooking",
      expect.objectContaining({ expectedPriceInCents: 20_000 }),
    );
  });

  it("AC-KAN-148-03: a taken slot offers to pick another time on the same day", async () => {
    mockSummary();
    callFunctionMock.mockRejectedValue(reasonError("slot_taken"));
    const page = createBookingCheckoutPage();

    const { router } = renderPage();

    await page.clickConfirm();
    expect(
      await screen.findByText(
        testI18n.t("customer:bookingCheckout.confirm.slotTakenError"),
      ),
    ).toBeInTheDocument();
    await page.clickChooseAnotherTime();
    expect(router.state.location.pathname).toBe(
      "/barberia-centro/book/service-1",
    );
    expect(router.state.location.search).toBe("?date=2026-11-20");
  });

  it("AC-KAN-148-04: a blocked customer sees why and no booking is made", async () => {
    mockSummary();
    callFunctionMock.mockRejectedValue(reasonError("customer_blocked"));
    const page = createBookingCheckoutPage();

    renderPage();

    await page.clickConfirm();
    expect(
      await screen.findByText(
        testI18n.t("customer:bookingCheckout.confirm.customerBlockedError"),
      ),
    ).toBeInTheDocument();
  });

  it("AC-KAN-148-06: after a network error the retry sends the same requestId", async () => {
    mockSummary();
    callFunctionMock
      .mockRejectedValueOnce(new FunctionsError("unavailable", "offline"))
      .mockResolvedValueOnce({ bookingId: "booking-9", status: "pending" });
    const page = createBookingCheckoutPage();

    renderPage();

    await page.clickConfirm();
    expect(
      await screen.findByText(testI18n.t("errors.network")),
    ).toBeInTheDocument();
    await page.clickConfirm();
    expect(await screen.findByText("done step")).toBeInTheDocument();
    const [firstCall, retryCall] = callFunctionMock.mock.calls;
    expect(retryCall?.[1].requestId).toBe(firstCall?.[1].requestId);
  });

  it("AC-KAN-148-08: a changed service reloads the summary", async () => {
    const summarySpy = mockSummary();
    callFunctionMock.mockRejectedValue(reasonError("service_changed"));
    const page = createBookingCheckoutPage();

    renderPage();

    await page.clickConfirm();
    expect(
      await screen.findByText(
        testI18n.t("customer:bookingCheckout.confirm.serviceChangedError"),
      ),
    ).toBeInTheDocument();
    expect(summarySpy).toHaveBeenCalledTimes(2);
  });

  it("AC-KAN-148-08: if reloading the changed service fails, the old summary cannot be confirmed", async () => {
    vi.spyOn(fetchCheckoutSummaryModule, "fetchCheckoutSummary")
      .mockResolvedValueOnce(SUMMARY)
      .mockRejectedValueOnce(new FirebaseError("unavailable", "offline"));
    callFunctionMock.mockRejectedValue(reasonError("service_changed"));
    const page = createBookingCheckoutPage();

    renderPage();

    await page.clickConfirm();
    expect(
      await screen.findByText(testI18n.t("errors.network")),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: testI18n.t("customer:bookingCheckout.confirm.action"),
      }),
    ).not.toBeInTheDocument();
  });
});
