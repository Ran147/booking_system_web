import { describe, expect, it } from "vitest";
import { resolveSupportTicketPayloadSchema } from "../models/ResolveSupportTicket.schema.js";

describe("resolveSupportTicketPayloadSchema", () => {
  it("validates valid payload", () => {
    const validData = {
      ticketId: "ticket-123",
    };

    const result = resolveSupportTicketPayloadSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails when ticketId is empty or whitespace only", () => {
    const emptyTicketId = {
      ticketId: "   ",
    };

    const result = resolveSupportTicketPayloadSchema.safeParse(emptyTicketId);
    expect(result.success).toBe(false);
  });
});
