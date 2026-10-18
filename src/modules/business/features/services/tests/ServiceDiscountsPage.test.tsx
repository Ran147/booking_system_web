import { waitFor, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BUSINESS_STATUS, SERVICE_STATUS } from "@/domain";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import { SUBSCRIBER_SESSION } from "@/test-utils/sessionFixtures";
import * as fetchBusinessInfoModule from "../api/fetchBusinessInfo";
import * as fetchServiceDetailModule from "../api/fetchServiceDetail";
import * as updateServiceDiscountsModule from "../api/updateServiceDiscounts";
import { ServiceDiscountsPage } from "../components/ServiceDiscountsPage";
import { DISCOUNT_TYPE } from "../constants/ServiceDiscount.constants";
import type { ServiceDetail } from "../models";
import { createServiceDiscountsPage } from "./ServiceDiscountsPage.page";

const MOCK_SERVICE: ServiceDetail = {
  description: "Corte de cabello profesional",
  discounts: [],
  durationMinutes: 45,
  features: ["Lavado incluido"],
  id: "service-123",
  imageUrl: null,
  name: "Corte Clásico",
  priceInCents: 2000,
  status: SERVICE_STATUS.ACTIVE,
};

describe("ServiceDiscountsPage (KAN-60)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(fetchBusinessInfoModule, "fetchBusinessInfo").mockResolvedValue({
      currency: "USD",
      status: BUSINESS_STATUS.ACTIVE,
      timeZone: "America/Costa_Rica",
    });
    vi.spyOn(fetchServiceDetailModule, "fetchServiceDetail").mockResolvedValue(
      MOCK_SERVICE,
    );
  });

  it("AC-KAN-60-01: saves percentage discount and renders value and validity dates", async () => {
    const updateSpy = vi
      .spyOn(updateServiceDiscountsModule, "updateServiceDiscounts")
      .mockResolvedValueOnce({ serviceId: "service-123" });

    renderWithProviders(
      <ServiceDiscountsPage
        initialService={MOCK_SERVICE}
        serviceId="service-123"
      />,
      {
        initialPath: "/business/services/service-123/discounts",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceDiscountsPage();

    await page.selectType(DISCOUNT_TYPE.PERCENTAGE);
    await page.typeValue(20);
    await page.typeStartDate("2026-11-01");
    await page.typeEndDate("2026-11-15");
    await page.clickAdd();

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "business-test",
        discounts: [
          expect.objectContaining({
            type: DISCOUNT_TYPE.PERCENTAGE,
            value: 20,
          }),
        ],
        serviceId: "service-123",
      }),
    );
  });

  it("AC-KAN-60-02: saves fixed-amount discount in cents and formats with currency", async () => {
    const updateSpy = vi
      .spyOn(updateServiceDiscountsModule, "updateServiceDiscounts")
      .mockResolvedValueOnce({ serviceId: "service-123" });

    renderWithProviders(
      <ServiceDiscountsPage
        initialService={MOCK_SERVICE}
        serviceId="service-123"
      />,
      {
        initialPath: "/business/services/service-123/discounts",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceDiscountsPage();

    await page.selectType(DISCOUNT_TYPE.FIXED_AMOUNT);
    await page.typeValue(5);
    await page.typeStartDate("2026-11-01");
    await page.typeEndDate("2026-11-15");
    await page.clickAdd();

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "business-test",
        discounts: [
          expect.objectContaining({
            type: DISCOUNT_TYPE.FIXED_AMOUNT,
            value: 500,
          }),
        ],
        serviceId: "service-123",
      }),
    );
  });

  it("AC-KAN-60-04: rejects percentage outside 1-100 or fixed amount >= service price with outOfRange", async () => {
    const updateSpy = vi.spyOn(
      updateServiceDiscountsModule,
      "updateServiceDiscounts",
    );

    renderWithProviders(
      <ServiceDiscountsPage
        initialService={MOCK_SERVICE}
        serviceId="service-123"
      />,
      {
        initialPath: "/business/services/service-123/discounts",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceDiscountsPage();

    // Percentage > 100
    await page.selectType(DISCOUNT_TYPE.PERCENTAGE);
    await page.typeValue(150);
    await page.typeStartDate("2026-11-01");
    await page.typeEndDate("2026-11-15");
    await page.clickAdd();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(page.getErrorMessage()).toHaveTextContent(
      /fuera del rango|out of range/i,
    );

    // Fixed amount >= service price ($20.00 service price, entering $25.00)
    await page.selectType(DISCOUNT_TYPE.FIXED_AMOUNT);
    await page.typeValue(25);
    await page.clickAdd();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(page.getErrorMessage()).toHaveTextContent(
      /fuera del rango|out of range/i,
    );
  });

  it("AC-KAN-60-05: rejects end date earlier than start date", async () => {
    const updateSpy = vi.spyOn(
      updateServiceDiscountsModule,
      "updateServiceDiscounts",
    );

    renderWithProviders(
      <ServiceDiscountsPage
        initialService={MOCK_SERVICE}
        serviceId="service-123"
      />,
      {
        initialPath: "/business/services/service-123/discounts",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceDiscountsPage();

    await page.selectType(DISCOUNT_TYPE.PERCENTAGE);
    await page.typeValue(15);
    await page.typeStartDate("2026-11-20");
    await page.typeEndDate("2026-11-10");
    await page.clickAdd();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(page.getErrorMessage()).toHaveTextContent(
      /fecha de fin debe ser posterior|end date must be on or after/i,
    );
  });

  it("AC-KAN-60-06: rejects discount overlapping with existing discount", async () => {
    const updateSpy = vi.spyOn(
      updateServiceDiscountsModule,
      "updateServiceDiscounts",
    );

    const serviceWithDiscount: ServiceDetail = {
      ...MOCK_SERVICE,
      discounts: [
        {
          endsAt: new Date("2026-11-15T23:59:59.999"),
          startsAt: new Date("2026-11-01T00:00:00"),
          type: "percentage",
          value: 10,
        },
      ],
    };

    vi.spyOn(
      fetchServiceDetailModule,
      "fetchServiceDetail",
    ).mockResolvedValueOnce(serviceWithDiscount);

    renderWithProviders(
      <ServiceDiscountsPage
        initialService={serviceWithDiscount}
        serviceId="service-123"
      />,
      {
        initialPath: "/business/services/service-123/discounts",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceDiscountsPage();

    await page.selectType(DISCOUNT_TYPE.PERCENTAGE);
    await page.typeValue(20);
    await page.typeStartDate("2026-11-10");
    await page.typeEndDate("2026-11-20");
    await page.clickAdd();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(page.getErrorMessage()).toHaveTextContent(
      /superpone con otro|overlaps with an existing/i,
    );
  });

  it("AC-KAN-60-07: disables changes and shows read-only alert when business is inactive", async () => {
    vi.spyOn(
      fetchBusinessInfoModule,
      "fetchBusinessInfo",
    ).mockResolvedValueOnce({
      currency: "USD",
      status: BUSINESS_STATUS.INACTIVE,
      timeZone: "UTC",
    });

    renderWithProviders(
      <ServiceDiscountsPage
        initialService={MOCK_SERVICE}
        serviceId="service-123"
      />,
      {
        initialPath: "/business/services/service-123/discounts",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceDiscountsPage();

    await waitFor(() => {
      expect(page.getReadOnlyAlert()).toBeInTheDocument();
    });

    expect(page.getAddButton()).toBeDisabled();
  });

  it("AC-KAN-60-08: shows network error when saving discount fails", async () => {
    vi.spyOn(
      updateServiceDiscountsModule,
      "updateServiceDiscounts",
    ).mockRejectedValueOnce(new Error("Network failed"));

    renderWithProviders(
      <ServiceDiscountsPage
        initialService={MOCK_SERVICE}
        serviceId="service-123"
      />,
      {
        initialPath: "/business/services/service-123/discounts",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceDiscountsPage();

    await page.selectType(DISCOUNT_TYPE.PERCENTAGE);
    await page.typeValue(20);
    await page.typeStartDate("2026-11-01");
    await page.typeEndDate("2026-11-15");
    await page.clickAdd();

    await waitFor(() => {
      expect(page.getErrorMessage()).toHaveTextContent(/red|network|conexión/i);
    });
  });

  it("AC-KAN-60-09: marks discount whose end date has passed as expired", async () => {
    const expiredDiscountService: ServiceDetail = {
      ...MOCK_SERVICE,
      discounts: [
        {
          endsAt: new Date("2020-01-01T23:59:59.999"),
          startsAt: new Date("2019-12-01T00:00:00"),
          type: "percentage",
          value: 15,
        },
      ],
    };

    vi.spyOn(
      fetchServiceDetailModule,
      "fetchServiceDetail",
    ).mockResolvedValueOnce(expiredDiscountService);

    renderWithProviders(
      <ServiceDiscountsPage
        initialService={expiredDiscountService}
        serviceId="service-123"
      />,
      {
        initialPath: "/business/services/service-123/discounts",
        session: SUBSCRIBER_SESSION,
      },
    );

    expect(await screen.findByText(/expirado|expired/i)).toBeInTheDocument();
  });

  it("AC-KAN-60-10: displays discounts for inactive service in the business management portal", async () => {
    const inactiveService: ServiceDetail = {
      ...MOCK_SERVICE,
      discounts: [
        {
          endsAt: new Date("2026-12-31T23:59:59.999"),
          startsAt: new Date("2026-12-01T00:00:00"),
          type: "percentage",
          value: 25,
        },
      ],
      status: SERVICE_STATUS.INACTIVE,
    };

    vi.spyOn(
      fetchServiceDetailModule,
      "fetchServiceDetail",
    ).mockResolvedValueOnce(inactiveService);

    renderWithProviders(
      <ServiceDiscountsPage
        initialService={inactiveService}
        serviceId="service-123"
      />,
      {
        initialPath: "/business/services/service-123/discounts",
        session: SUBSCRIBER_SESSION,
      },
    );

    expect(await screen.findByText("25%")).toBeInTheDocument();
  });
});
