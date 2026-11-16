import { describe, expect, it } from "vitest";
import { createSupportTicketPayloadSchema } from "../models/CreateSupportTicket.schema.js";

describe("createSupportTicketPayloadSchema", () => {
  it("validates a correct payload", () => {
    const payload = {
      businessId: "business-123",
      message: "Necesito asistencia con la configuración de la agenda.",
      subject: "Problema con agenda",
    };

    const result = createSupportTicketPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("fails when businessId is empty", () => {
    const payload = {
      businessId: "   ",
      message: "Mensaje válido",
      subject: "Asunto válido",
    };

    const result = createSupportTicketPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("fails when subject is empty", () => {
    const payload = {
      businessId: "business-123",
      message: "Mensaje válido",
      subject: "   ",
    };

    const result = createSupportTicketPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("fails when subject exceeds 120 characters", () => {
    const payload = {
      businessId: "business-123",
      message: "Mensaje válido",
      subject: "a".repeat(121),
    };

    const result = createSupportTicketPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("fails when message is empty", () => {
    const payload = {
      businessId: "business-123",
      message: "",
      subject: "Asunto válido",
    };

    const result = createSupportTicketPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("fails when message exceeds 5000 characters", () => {
    const payload = {
      businessId: "business-123",
      message: "a".repeat(5001),
      subject: "Asunto válido",
    };

    const result = createSupportTicketPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
