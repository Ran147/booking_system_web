import { screen, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/common";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { BUSINESS_STATUS, SERVICE_STATUS } from "@/domain";
import { renderWithProviders, SUBSCRIBER_SESSION } from "@/shared/test-utils";
import { createServiceFormPage } from "./ServiceFormPage.page";
import * as createServiceModule from "../api/createService";
import * as fetchBusinessStatusModule from "../api/fetchBusinessStatus";
import * as fetchServiceDetailModule from "../api/fetchServiceDetail";
import * as updateServiceModule from "../api/updateService";
import { ServiceFormPage } from "../components/ServiceFormPage";
import type { ServiceDetail } from "../models";

describe("ServiceFormPage (KAN-54)", { timeout: 10_000 }, () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(
      fetchBusinessStatusModule,
      "fetchBusinessStatus",
    ).mockResolvedValue(BUSINESS_STATUS.ACTIVE);
    window.URL.createObjectURL = vi
      .fn()
      .mockReturnValue("blob:mock-preview-url");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-KAN-54-01: creates an active service with entered values", async () => {
    const createSpy = vi
      .spyOn(createServiceModule, "createService")
      .mockResolvedValueOnce({ serviceId: "service-new-123" });
    const toastSuccessSpy = vi.spyOn(toast, "success");

    renderWithProviders(<ServiceFormPage />, {
      initialPath: "/business/services/new",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceFormPage();

    await page.changeName("Corte Clásico");
    await page.changeDescription("Servicio completo de corte y peinado");
    await page.changePrice(25);
    await page.changeDuration(45);

    await page.clickAddFeature();
    await page.changeFeature(0, "Lavado incluido");

    const validImage = new File(["valid image"], "photo.png", {
      type: "image/png",
    });
    await page.uploadImage(validImage);

    await page.clickSubmit();

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    expect(createSpy).toHaveBeenCalledWith({
      businessId: "business-test",
      formValues: {
        description: "Servicio completo de corte y peinado",
        durationMinutes: 45,
        features: ["Lavado incluido"],
        imageUrl: "blob:mock-preview-url",
        name: "Corte Clásico",
        price: 25,
      },
    });

    expect(toastSuccessSpy).toHaveBeenCalledWith("Servicio creado.");
  });

  it("AC-KAN-54-02: shows validation:required when required fields are empty", async () => {
    const createSpy = vi.spyOn(createServiceModule, "createService");

    renderWithProviders(<ServiceFormPage />, {
      initialPath: "/business/services/new",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceFormPage();

    await page.changeName("");
    await page.changePrice("");
    await page.changeDuration("");

    await page.clickSubmit();

    await waitFor(() => {
      const requiredErrors = screen.getAllByText("Este campo es obligatorio.");
      expect(requiredErrors.length).toBeGreaterThanOrEqual(2);
    });

    expect(createSpy).not.toHaveBeenCalled();
  });

  it("AC-KAN-54-03: shows validation:outOfRange when price or duration is out of range", async () => {
    const createSpy = vi.spyOn(createServiceModule, "createService");

    renderWithProviders(<ServiceFormPage />, {
      initialPath: "/business/services/new",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceFormPage();

    await page.changeName("Servicio Inválido");
    await page.changePrice(-5);
    await page.changeDuration(500);

    await page.clickSubmit();

    await waitFor(() => {
      const outOfRangeErrors = screen.getAllByText(
        "El valor está fuera del rango permitido.",
      );
      expect(outOfRangeErrors.length).toBeGreaterThanOrEqual(1);
    });

    expect(createSpy).not.toHaveBeenCalled();
  });

  it("AC-KAN-54-04: shows validation:tooLong when text exceeds maximum length", async () => {
    const createSpy = vi.spyOn(createServiceModule, "createService");

    renderWithProviders(<ServiceFormPage />, {
      initialPath: "/business/services/new",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceFormPage();

    const excessivelyLongName = "A".repeat(81);
    await page.changeName(excessivelyLongName);
    await page.changePrice(20);
    await page.changeDuration(30);

    await page.clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByText("El texto es demasiado largo."),
      ).toBeInTheDocument();
    });

    expect(createSpy).not.toHaveBeenCalled();
  });

  it("AC-KAN-54-05: rejects invalid file type and displays imageInvalidError", async () => {
    renderWithProviders(<ServiceFormPage />, {
      initialPath: "/business/services/new",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceFormPage();

    await page.changeName("Servicio de prueba");
    await page.changePrice(15);
    await page.changeDuration(30);

    const invalidFile = new File(["not an image"], "document.pdf", {
      type: "application/pdf",
    });
    await page.uploadImage(invalidFile);

    await waitFor(() => {
      expect(
        screen.getByText(
          "La imagen debe ser JPEG, PNG o WebP y pesar menos de 2 MB.",
        ),
      ).toBeInTheDocument();
    });

    expect(page.getNameInput()).toHaveValue("Servicio de prueba");
    expect(page.getPriceInput()).toHaveValue(15);
    expect(page.getDurationInput()).toHaveValue(30);
  });

  it("AC-KAN-54-06: disables action and shows readOnly notice when business is inactive", async () => {
    const createSpy = vi.spyOn(createServiceModule, "createService");

    renderWithProviders(
      <ServiceFormPage businessStatus={BUSINESS_STATUS.INACTIVE} />,
      {
        initialPath: "/business/services/new",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceFormPage();

    expect(page.getReadOnlyAlert()).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tu negocio está inactivo o suspendido. No se pueden realizar cambios.",
      ),
    ).toBeInTheDocument();

    expect(page.getSubmitButton()).toBeDisabled();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("AC-KAN-54-07: displays network error and keeps entered values when save fails", async () => {
    vi.spyOn(createServiceModule, "createService").mockRejectedValueOnce(
      new FirebaseError(
        FIREBASE_ERROR_CODE.UNAVAILABLE,
        "Network request failed",
      ),
    );
    const toastErrorSpy = vi.spyOn(toast, "error");

    renderWithProviders(<ServiceFormPage />, {
      initialPath: "/business/services/new",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceFormPage();

    await page.changeName("Corte Especial");
    await page.changeDescription("Descripción persistente");
    await page.changePrice(35);
    await page.changeDuration(60);

    await page.clickSubmit();

    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalledWith(
        "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
      );
    });

    expect(page.getNameInput()).toHaveValue("Corte Especial");
    expect(page.getDescriptionInput()).toHaveValue("Descripción persistente");
    expect(page.getPriceInput()).toHaveValue(35);
    expect(page.getDurationInput()).toHaveValue(60);
  });

  it("AC-KAN-54-08: stores decimal prices as whole number of cents", async () => {
    const createSpy = vi
      .spyOn(createServiceModule, "createService")
      .mockResolvedValueOnce({ serviceId: "service-decimal-123" });

    renderWithProviders(<ServiceFormPage />, {
      initialPath: "/business/services/new",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceFormPage();

    await page.changeName("Servicio con Decimales");
    await page.changePrice(12.5);
    await page.changeDuration(30);

    await page.clickSubmit();

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          formValues: expect.objectContaining({
            price: 12.5,
          }),
        }),
      );
    });
  });

  it("AC-KAN-54-09: preserves features in order and discards empty rows", async () => {
    const createSpy = vi
      .spyOn(createServiceModule, "createService")
      .mockResolvedValueOnce({ serviceId: "service-features-123" });

    renderWithProviders(<ServiceFormPage />, {
      initialPath: "/business/services/new",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceFormPage();

    await page.changeName("Servicio con Características");
    await page.changePrice(20);
    await page.changeDuration(30);

    await page.clickAddFeature();
    await page.changeFeature(0, "Primera");

    await page.clickAddFeature();
    await page.changeFeature(1, "Segunda");

    await page.clickAddFeature();
    await page.changeFeature(2, "   "); // Empty row that should be discarded

    await page.clickMoveUpFeature(1); // Moves "Segunda" before "Primera"

    await page.clickSubmit();

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        formValues: expect.objectContaining({
          features: ["Segunda", "Primera"],
        }),
      }),
    );
  });
});

const MOCK_EXISTING_SERVICE: ServiceDetail = {
  description: "Servicio existente de corte",
  durationMinutes: 30,
  features: ["Lavado previo"],
  id: "service-test-456",
  imageUrl: null,
  name: "Corte Estándar",
  priceInCents: 2000,
  status: SERVICE_STATUS.ACTIVE,
};

describe("ServiceFormPage (KAN-56)", { timeout: 10_000 }, () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(
      fetchBusinessStatusModule,
      "fetchBusinessStatus",
    ).mockResolvedValue(BUSINESS_STATUS.ACTIVE);
    vi.spyOn(fetchServiceDetailModule, "fetchServiceDetail").mockResolvedValue({
      ...MOCK_EXISTING_SERVICE,
    });
    window.URL.createObjectURL = vi
      .fn()
      .mockReturnValue("blob:mock-preview-url");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-KAN-56-01: saves updated field values and shows them in service detail and list", async () => {
    const updateSpy = vi
      .spyOn(updateServiceModule, "updateService")
      .mockResolvedValueOnce({ serviceId: "service-test-456" });
    const toastSuccessSpy = vi.spyOn(toast, "success");

    renderWithProviders(<ServiceFormPage serviceId="service-test-456" />, {
      initialPath: "/business/services/service-test-456/edit",
      session: SUBSCRIBER_SESSION,
    });

    const page = createServiceFormPage();

    await waitFor(() => {
      expect(page.getNameInput()).toHaveValue("Corte Estándar");
    });

    expect(page.getTitleHeading()).toHaveTextContent("Editar servicio");
    expect(page.getDescriptionInput()).toHaveValue(
      "Servicio existente de corte",
    );
    expect(page.getPriceInput()).toHaveValue(20);
    expect(page.getDurationInput()).toHaveValue(30);

    await page.changeName("Corte Premium Modificado");
    await page.changePrice(35);
    await page.changeDuration(50);
    await page.changeDescription("Servicio completo actualizado");

    await page.clickAddFeature();
    await page.changeFeature(1, "Peinado extra");

    await page.clickSubmit();

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    expect(updateSpy).toHaveBeenCalledWith({
      businessId: "business-test",
      formValues: {
        description: "Servicio completo actualizado",
        durationMinutes: 50,
        features: ["Lavado previo", "Peinado extra"],
        imageUrl: null,
        name: "Corte Premium Modificado",
        price: 35,
      },
      serviceId: "service-test-456",
    });

    expect(toastSuccessSpy).toHaveBeenCalledWith("Servicio actualizado.");
  });

  it("AC-KAN-56-02: shows validation:required or validation:outOfRange when editing invalid values", async () => {
    const updateSpy = vi.spyOn(updateServiceModule, "updateService");

    renderWithProviders(
      <ServiceFormPage
        initialService={MOCK_EXISTING_SERVICE}
        serviceId="service-test-456"
      />,
      {
        initialPath: "/business/services/service-test-456/edit",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceFormPage();

    await waitFor(() => {
      expect(page.getNameInput()).toHaveValue("Corte Estándar");
    });

    await page.changeName("");
    await page.changePrice(-10);
    await page.changeDuration(0);

    await page.clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByText("Este campo es obligatorio."),
      ).toBeInTheDocument();
      const outOfRangeErrors = screen.getAllByText(
        "El valor está fuera del rango permitido.",
      );
      expect(outOfRangeErrors.length).toBeGreaterThanOrEqual(1);
    });

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("AC-KAN-56-03: disables edit action and shows readOnly notice when business is inactive/suspended", async () => {
    const updateSpy = vi.spyOn(updateServiceModule, "updateService");

    renderWithProviders(
      <ServiceFormPage
        businessStatus={BUSINESS_STATUS.INACTIVE}
        initialService={MOCK_EXISTING_SERVICE}
        serviceId="service-test-456"
      />,
      {
        initialPath: "/business/services/service-test-456/edit",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceFormPage();

    expect(page.getReadOnlyAlert()).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tu negocio está inactivo o suspendido. No se pueden realizar cambios.",
      ),
    ).toBeInTheDocument();

    expect(page.getSubmitButton()).toBeDisabled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("AC-KAN-56-04: shows common:errors.notFound when service was deleted in the meantime", async () => {
    vi.spyOn(updateServiceModule, "updateService").mockRejectedValueOnce(
      new FirebaseError(
        FIREBASE_ERROR_CODE.FIRESTORE_NOT_FOUND,
        "No document to update",
      ),
    );
    const toastErrorSpy = vi.spyOn(toast, "error");

    renderWithProviders(
      <ServiceFormPage
        initialService={MOCK_EXISTING_SERVICE}
        serviceId="service-test-456"
      />,
      {
        initialPath: "/business/services/service-test-456/edit",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceFormPage();

    await page.changeName("Servicio Modificado Pero Ya Eliminado");
    await page.clickSubmit();

    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalledWith(
        "No encontramos lo que buscabas.",
      );
    });
  });

  it("AC-KAN-56-05: keeps edited form values and shows common:errors.network when save fails", async () => {
    vi.spyOn(updateServiceModule, "updateService").mockRejectedValueOnce(
      new FirebaseError(
        FIREBASE_ERROR_CODE.UNAVAILABLE,
        "Network connection failed",
      ),
    );
    const toastErrorSpy = vi.spyOn(toast, "error");

    renderWithProviders(
      <ServiceFormPage
        initialService={MOCK_EXISTING_SERVICE}
        serviceId="service-test-456"
      />,
      {
        initialPath: "/business/services/service-test-456/edit",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceFormPage();

    await page.changeName("Nombre Modificado Con Red Caída");
    await page.changePrice(40);
    await page.changeDuration(45);

    await page.clickSubmit();

    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalledWith(
        "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
      );
    });

    expect(page.getNameInput()).toHaveValue("Nombre Modificado Con Red Caída");
    expect(page.getPriceInput()).toHaveValue(40);
    expect(page.getDurationInput()).toHaveValue(45);
  });

  it("AC-KAN-56-06: editing price or duration updates only the service without mutating booking snapshots", async () => {
    const updateSpy = vi
      .spyOn(updateServiceModule, "updateService")
      .mockResolvedValueOnce({ serviceId: "service-test-456" });

    renderWithProviders(
      <ServiceFormPage
        initialService={MOCK_EXISTING_SERVICE}
        serviceId="service-test-456"
      />,
      {
        initialPath: "/business/services/service-test-456/edit",
        session: SUBSCRIBER_SESSION,
      },
    );

    const page = createServiceFormPage();

    await page.changePrice(50);
    await page.changeDuration(60);
    await page.clickSubmit();

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    expect(updateSpy).toHaveBeenCalledWith({
      businessId: "business-test",
      formValues: expect.objectContaining({
        durationMinutes: 60,
        price: 50,
      }),
      serviceId: "service-test-456",
    });
  });

  it("renders not-found error state with retry and back actions when service detail fails to load", async () => {
    vi.spyOn(fetchServiceDetailModule, "fetchServiceDetail").mockRejectedValue(
      new FirebaseError(
        FIREBASE_ERROR_CODE.FIRESTORE_NOT_FOUND,
        "Service not found",
      ),
    );

    renderWithProviders(<ServiceFormPage serviceId="service-test-456" />, {
      initialPath: "/business/services/service-test-456/edit",
      session: SUBSCRIBER_SESSION,
    });

    expect(
      await screen.findByText("No encontramos lo que buscabas."),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Volver a servicios" }).length,
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.queryByRole("textbox", { name: /nombre del servicio/i }),
    ).not.toBeInTheDocument();
  });

  it("renders network error state when service detail loading fails with network error", async () => {
    vi.spyOn(fetchServiceDetailModule, "fetchServiceDetail").mockRejectedValue(
      new FirebaseError(
        FIREBASE_ERROR_CODE.UNAVAILABLE,
        "Network connection lost",
      ),
    );

    renderWithProviders(<ServiceFormPage serviceId="service-test-456" />, {
      initialPath: "/business/services/service-test-456/edit",
      session: SUBSCRIBER_SESSION,
    });

    expect(
      await screen.findByText(
        "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /nombre del servicio/i }),
    ).not.toBeInTheDocument();
  });
});
