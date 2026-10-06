import { screen, waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/common";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { BUSINESS_STATUS } from "@/domain";
import { renderWithProviders, SUBSCRIBER_SESSION } from "@/shared/test-utils";
import { createServiceFormPage } from "./ServiceFormPage.page";
import * as createServiceModule from "../api/createService";
import * as fetchBusinessStatusModule from "../api/fetchBusinessStatus";
import { ServiceFormPage } from "../components/ServiceFormPage";

describe("ServiceFormPage (KAN-54)", () => {
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
