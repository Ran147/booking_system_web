import {
  BOOKING_STATUS,
  BOOKING_STATUS_TRANSITIONS,
  BUSINESS_STATUS,
  BUSINESS_STATUS_TRANSITIONS,
  COLLABORATOR_STATUS,
  COLLABORATOR_STATUS_TRANSITIONS,
  CUSTOMER_STATUS,
  CUSTOMER_STATUS_TRANSITIONS,
  PLAN_STATUS,
  PLAN_STATUS_TRANSITIONS,
  SERVICE_STATUS,
  SERVICE_STATUS_TRANSITIONS,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_TRANSITIONS,
  SUPPORT_TICKET_STATUS,
  SUPPORT_TICKET_STATUS_TRANSITIONS,
  canTransition,
} from "@/shared/domain";

describe("canTransition for bookings", () => {
  it("KAN-70: allows confirming a pending booking", () => {
    expect(
      canTransition(
        BOOKING_STATUS_TRANSITIONS,
        BOOKING_STATUS.PENDING,
        BOOKING_STATUS.CONFIRMED,
      ),
    ).toBe(true);
  });

  it("KAN-72: allows cancelling a pending or confirmed booking", () => {
    expect(
      canTransition(
        BOOKING_STATUS_TRANSITIONS,
        BOOKING_STATUS.PENDING,
        BOOKING_STATUS.CANCELLED,
      ),
    ).toBe(true);
    expect(
      canTransition(
        BOOKING_STATUS_TRANSITIONS,
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.CANCELLED,
      ),
    ).toBe(true);
  });

  it("KAN-73: allows completing a confirmed booking", () => {
    expect(
      canTransition(
        BOOKING_STATUS_TRANSITIONS,
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.COMPLETED,
      ),
    ).toBe(true);
  });

  it("KAN-73: rejects completing a pending booking", () => {
    expect(
      canTransition(
        BOOKING_STATUS_TRANSITIONS,
        BOOKING_STATUS.PENDING,
        BOOKING_STATUS.COMPLETED,
      ),
    ).toBe(false);
  });

  it("KAN-74: rejects marking a cancelled booking as no-show", () => {
    expect(
      canTransition(
        BOOKING_STATUS_TRANSITIONS,
        BOOKING_STATUS.CANCELLED,
        BOOKING_STATUS.NO_SHOW,
      ),
    ).toBe(false);
  });

  it.each([
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.NO_SHOW,
  ])("keeps the terminal status %s without transitions", (terminalStatus) => {
    expect(BOOKING_STATUS_TRANSITIONS[terminalStatus]).toEqual([]);
  });
});

describe("canTransition for subscriptions", () => {
  it("moves an active subscription to past_due when a renewal charge fails (Q5)", () => {
    expect(
      canTransition(
        SUBSCRIPTION_STATUS_TRANSITIONS,
        SUBSCRIPTION_STATUS.ACTIVE,
        SUBSCRIPTION_STATUS.PAST_DUE,
      ),
    ).toBe(true);
  });

  it("KAN-45: reactivates an expired subscription with a new payment", () => {
    expect(
      canTransition(
        SUBSCRIPTION_STATUS_TRANSITIONS,
        SUBSCRIPTION_STATUS.EXPIRED,
        SUBSCRIPTION_STATUS.ACTIVE,
      ),
    ).toBe(true);
  });

  it("KAN-47: rejects expiring an active subscription directly", () => {
    expect(
      canTransition(
        SUBSCRIPTION_STATUS_TRANSITIONS,
        SUBSCRIPTION_STATUS.ACTIVE,
        SUBSCRIPTION_STATUS.EXPIRED,
      ),
    ).toBe(false);
  });
});

describe("canTransition for businesses", () => {
  it("KAN-49: moves an active business to inactive", () => {
    expect(
      canTransition(
        BUSINESS_STATUS_TRANSITIONS,
        BUSINESS_STATUS.ACTIVE,
        BUSINESS_STATUS.INACTIVE,
      ),
    ).toBe(true);
  });

  it("KAN-179: reactivates a suspended business", () => {
    expect(
      canTransition(
        BUSINESS_STATUS_TRANSITIONS,
        BUSINESS_STATUS.SUSPENDED,
        BUSINESS_STATUS.ACTIVE,
      ),
    ).toBe(true);
  });

  it("KAN-49: rejects moving a suspended business to inactive", () => {
    expect(
      canTransition(
        BUSINESS_STATUS_TRANSITIONS,
        BUSINESS_STATUS.SUSPENDED,
        BUSINESS_STATUS.INACTIVE,
      ),
    ).toBe(false);
  });

  it("PROP-1, KAN-176: approves a pending business", () => {
    expect(
      canTransition(
        BUSINESS_STATUS_TRANSITIONS,
        BUSINESS_STATUS.PENDING,
        BUSINESS_STATUS.ACTIVE,
      ),
    ).toBe(true);
  });

  it("PROP-1: rejects a pending business", () => {
    expect(
      canTransition(
        BUSINESS_STATUS_TRANSITIONS,
        BUSINESS_STATUS.PENDING,
        BUSINESS_STATUS.REJECTED,
      ),
    ).toBe(true);
  });

  it("PROP-2: rejects suspending a pending business", () => {
    expect(
      canTransition(
        BUSINESS_STATUS_TRANSITIONS,
        BUSINESS_STATUS.PENDING,
        BUSINESS_STATUS.SUSPENDED,
      ),
    ).toBe(false);
  });

  it("PROP-2: suspends an active business", () => {
    expect(
      canTransition(
        BUSINESS_STATUS_TRANSITIONS,
        BUSINESS_STATUS.ACTIVE,
        BUSINESS_STATUS.SUSPENDED,
      ),
    ).toBe(true);
  });

  it("KAN-176: rejects sending an inactive business back to pending", () => {
    expect(
      canTransition(
        BUSINESS_STATUS_TRANSITIONS,
        BUSINESS_STATUS.INACTIVE,
        BUSINESS_STATUS.PENDING,
      ),
    ).toBe(false);
  });

  it("PROP-1: keeps a rejected business terminal", () => {
    expect(BUSINESS_STATUS_TRANSITIONS[BUSINESS_STATUS.REJECTED]).toEqual([]);
  });
});

describe("canTransition for collaborators", () => {
  it("KAN-79: activates an invited collaborator who accepts the invitation", () => {
    expect(
      canTransition(
        COLLABORATOR_STATUS_TRANSITIONS,
        COLLABORATOR_STATUS.INVITED,
        COLLABORATOR_STATUS.ACTIVE,
      ),
    ).toBe(true);
  });

  it("KAN-81: deactivates an active collaborator", () => {
    expect(
      canTransition(
        COLLABORATOR_STATUS_TRANSITIONS,
        COLLABORATOR_STATUS.ACTIVE,
        COLLABORATOR_STATUS.INACTIVE,
      ),
    ).toBe(true);
  });

  it("KAN-82: reactivates an inactive collaborator", () => {
    expect(
      canTransition(
        COLLABORATOR_STATUS_TRANSITIONS,
        COLLABORATOR_STATUS.INACTIVE,
        COLLABORATOR_STATUS.ACTIVE,
      ),
    ).toBe(true);
  });

  it("KAN-81: rejects deactivating a collaborator who has not accepted the invitation", () => {
    expect(
      canTransition(
        COLLABORATOR_STATUS_TRANSITIONS,
        COLLABORATOR_STATUS.INVITED,
        COLLABORATOR_STATUS.INACTIVE,
      ),
    ).toBe(false);
  });

  it("KAN-82: rejects sending an inactive collaborator back to invited", () => {
    expect(
      canTransition(
        COLLABORATOR_STATUS_TRANSITIONS,
        COLLABORATOR_STATUS.INACTIVE,
        COLLABORATOR_STATUS.INVITED,
      ),
    ).toBe(false);
  });
});

describe("canTransition for support tickets", () => {
  it("KAN-191: moves an open ticket to in_progress", () => {
    expect(
      canTransition(
        SUPPORT_TICKET_STATUS_TRANSITIONS,
        SUPPORT_TICKET_STATUS.OPEN,
        SUPPORT_TICKET_STATUS.IN_PROGRESS,
      ),
    ).toBe(true);
  });

  it("KAN-192: resolves a ticket in progress", () => {
    expect(
      canTransition(
        SUPPORT_TICKET_STATUS_TRANSITIONS,
        SUPPORT_TICKET_STATUS.IN_PROGRESS,
        SUPPORT_TICKET_STATUS.RESOLVED,
      ),
    ).toBe(true);
  });

  it("KAN-192: rejects reopening a resolved ticket", () => {
    expect(
      canTransition(
        SUPPORT_TICKET_STATUS_TRANSITIONS,
        SUPPORT_TICKET_STATUS.RESOLVED,
        SUPPORT_TICKET_STATUS.OPEN,
      ),
    ).toBe(false);
  });
});

describe("canTransition for two-state entities", () => {
  it("KAN-58: deactivates and reactivates a service", () => {
    expect(
      canTransition(
        SERVICE_STATUS_TRANSITIONS,
        SERVICE_STATUS.ACTIVE,
        SERVICE_STATUS.INACTIVE,
      ),
    ).toBe(true);
    expect(
      canTransition(
        SERVICE_STATUS_TRANSITIONS,
        SERVICE_STATUS.INACTIVE,
        SERVICE_STATUS.ACTIVE,
      ),
    ).toBe(true);
  });

  it("KAN-93: blocks an active customer", () => {
    expect(
      canTransition(
        CUSTOMER_STATUS_TRANSITIONS,
        CUSTOMER_STATUS.ACTIVE,
        CUSTOMER_STATUS.BLOCKED,
      ),
    ).toBe(true);
  });

  it("KAN-94: rejects blocking an already blocked customer", () => {
    expect(
      canTransition(
        CUSTOMER_STATUS_TRANSITIONS,
        CUSTOMER_STATUS.BLOCKED,
        CUSTOMER_STATUS.BLOCKED,
      ),
    ).toBe(false);
  });

  it("KAN-184: deactivates an active plan", () => {
    expect(
      canTransition(
        PLAN_STATUS_TRANSITIONS,
        PLAN_STATUS.ACTIVE,
        PLAN_STATUS.INACTIVE,
      ),
    ).toBe(true);
  });
});
