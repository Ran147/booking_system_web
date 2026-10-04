import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../Card";

const TITLE_PLAN = "Plan Pro";
const DESC_PLAN = "Para profesionales";
const DETAIL_PLAN = "Detalle del plan";
const FOOTER_PLAN = "Boton de compra";

describe("Card", () => {
  it("renders a full structured card with header, content, and footer", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>{TITLE_PLAN}</CardTitle>
          <CardDescription>{DESC_PLAN}</CardDescription>
        </CardHeader>
        <CardContent>{DETAIL_PLAN}</CardContent>
        <CardFooter>{FOOTER_PLAN}</CardFooter>
      </Card>,
    );

    expect(screen.getByText(TITLE_PLAN)).toBeInTheDocument();
    expect(screen.getByText(DESC_PLAN)).toBeInTheDocument();
    expect(screen.getByText(DETAIL_PLAN)).toBeInTheDocument();
    expect(screen.getByText(FOOTER_PLAN)).toBeInTheDocument();
  });
});
