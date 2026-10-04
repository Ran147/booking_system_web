import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "../Badge";
import { BADGE_VARIANT } from "../constants/badge.constants";

const TEXT_ACTIVE = "Activo";
const TEXT_CANCELLED = "Cancelado";

describe("Badge", () => {
  it("renders children text properly", () => {
    render(<Badge>{TEXT_ACTIVE}</Badge>);
    expect(screen.getByText(TEXT_ACTIVE)).toBeInTheDocument();
  });

  it("applies the destructive variant classes", () => {
    render(<Badge variant={BADGE_VARIANT.DESTRUCTIVE}>{TEXT_CANCELLED}</Badge>);
    const badge = screen.getByText(TEXT_CANCELLED).parentElement;
    expect(badge).toHaveClass("text-destructive");
  });
});
