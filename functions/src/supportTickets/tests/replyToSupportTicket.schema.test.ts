import { describe, expect, it } from "vitest";
import { replyToSupportTicketPayloadSchema } from "../models/ReplyToSupportTicket.schema.js";

describe("replyToSupportTicketPayloadSchema", () => {
  it("validates valid payload", () => {
    const validData = {
      body: "Esta es una respuesta al ticket.",
      ticketId: "ticket-123",
    };

    const result = replyToSupportTicketPayloadSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails when body is empty or whitespace only", () => {
    const emptyBody = {
      body: "   ",
      ticketId: "ticket-123",
    };

    const result = replyToSupportTicketPayloadSchema.safeParse(emptyBody);
    expect(result.success).toBe(false);
  });

  it("fails when body exceeds 5000 characters", () => {
    const longBody = {
      body: "a".repeat(5001),
      ticketId: "ticket-123",
    };

    const result = replyToSupportTicketPayloadSchema.safeParse(longBody);
    expect(result.success).toBe(false);
  });

  it("fails when ticketId is missing or empty", () => {
    const missingTicketId = {
      body: "Respuesta",
      ticketId: "",
    };

    const result = replyToSupportTicketPayloadSchema.safeParse(missingTicketId);
    expect(result.success).toBe(false);
  });
});
