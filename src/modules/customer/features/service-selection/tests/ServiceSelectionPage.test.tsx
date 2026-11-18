import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CUSTOMER_SESSION, renderRoutesWithProviders } from "@/test-utils";
import { testI18n } from "@/test-utils/testI18n";
import * as fetchBookableCatalogModule from "../api/fetchBookableCatalog";
import { ServiceSelectionPage } from "../components/ServiceSelectionPage/ServiceSelectionPage";

const CATALOG = {
  currency: "CRC",
  services: [
    {
      durationMinutes: 45,
      id: "service-1",
      name: "Corte",
      priceInCents: 25_000,
    },
    {
      durationMinutes: 30,
      id: "service-2",
      name: "Barba",
      priceInCents: 15_000,
    },
  ],
};

const renderPage = (): ReturnType<typeof renderRoutesWithProviders> =>
  renderRoutesWithProviders(
    [
      { element: <ServiceSelectionPage />, path: "/:businessSlug/book" },
      {
        element: <p>availability step</p>,
        path: "/:businessSlug/book/:serviceId",
      },
    ],
    { initialPath: "/barberia-centro/book", session: CUSTOMER_SESSION },
  );

const continueButtonName = (): string =>
  testI18n.t("customer:serviceSelection.continueAction");

describe("ServiceSelectionPage (KAN-135, minimal)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-KAN-135-01: lists the active services and continues with the chosen one", async () => {
    vi.spyOn(
      fetchBookableCatalogModule,
      "fetchBookableCatalog",
    ).mockResolvedValue(CATALOG);
    const user = userEvent.setup();

    const { router } = renderPage();

    await user.click(await screen.findByRole("radio", { name: /Barba/ }));
    expect(screen.getByRole("radio", { name: /Corte/ })).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: continueButtonName() }),
    );
    expect(router.state.location.pathname).toBe(
      "/barberia-centro/book/service-2",
    );
  });

  it("AC-KAN-135-04: continuing without a service stays and says why", async () => {
    vi.spyOn(
      fetchBookableCatalogModule,
      "fetchBookableCatalog",
    ).mockResolvedValue(CATALOG);
    const user = userEvent.setup();

    const { router } = renderPage();

    await user.click(
      await screen.findByRole("button", { name: continueButtonName() }),
    );
    expect(
      screen.getByText(
        testI18n.t("customer:serviceSelection.errors.serviceRequired"),
      ),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/barberia-centro/book");
  });

  it("AC-KAN-135-06: a network error shows the message and a retry", async () => {
    vi.spyOn(fetchBookableCatalogModule, "fetchBookableCatalog")
      .mockRejectedValueOnce(new FirebaseError("unavailable", "offline"))
      .mockResolvedValue(CATALOG);
    const user = userEvent.setup();

    renderPage();

    expect(
      await screen.findByText(testI18n.t("errors.network")),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: testI18n.t("customer:availability.retryAction"),
      }),
    );
    expect(
      await screen.findByRole("radio", { name: /Corte/ }),
    ).toBeInTheDocument();
  });

  it("AC-KAN-135-08: a business without active services shows the empty state", async () => {
    vi.spyOn(
      fetchBookableCatalogModule,
      "fetchBookableCatalog",
    ).mockResolvedValue({
      currency: "CRC",
      services: [],
    });

    renderPage();

    expect(
      await screen.findByText(
        testI18n.t("customer:serviceSelection.list.empty"),
      ),
    ).toBeInTheDocument();
  });
});
